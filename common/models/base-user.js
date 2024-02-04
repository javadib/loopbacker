'use strict';

const util = require('util');
const path = require('path');
const speakeasy = require('speakeasy');
const secret = speakeasy.generateSecret();

const error = require('../utils/error-provider.js');

module.exports = function (BaseUser) {
  const step = 120;
  let settings = BaseUser.definition.settings;

  require('./base-user/')(BaseUser);

  BaseUser.generateCode = function () {
    return speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      digits: 4,
      window: 6,
      step: step,
    });
  };

  BaseUser.verifyCode = function (token) {
    return speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      digits: 4,
      window: 6,
      step: step,
    });
  };

  BaseUser.observe('after save', function (ctx, next) {
    let Model = ctx.Model;
    let user = ctx.instance || ctx.data;

    if (ctx.isNewInstance) {
      let options = ctx.options || {};
      let role = options.role;
      let roleName = options.roleName;
      let userOption = options.userOption;

      if (userOption) BaseUser.createAccessToken(user, userOption.isPersist === true);

      if (role) {
        user.createUserRole(role, user);
      } else if (roleName) {
        user.createRoleByName(roleName);
      }

      const authentication = Model.definition.settings.authentication;
      if (authentication && authentication.sendActivationCode) {
        let code = BaseUser.generateCode();

        Model.emit('userCreated', {user: user, activationCode: code});
      }
    }

    next();
  });

  BaseUser.setup = function () {
    BaseUser.base.setup.call(this);
    var UserModel = this;
    let settings = UserModel.definition.settings;

    delete UserModel.validations.username;
    // UserModel.validatesUniquenessOf('username', {message: 'username already exist.'});

    UserModel.activatedData = {};
    UserModel.prototype.isActiveUser = function () {
      var user = this;

      return user.isActive;
    };

    UserModel.createAccessToken = function (user, isPersist) {
      let data = {ttl: settings.ttl || 1209600, isPersist: isPersist};
      user.accessTokens.create(data)
        .then(token => console.log(`the accessToken ${token.id} created for ${user.email || user.username}.`),
          console.error);
    };

    UserModel.prototype.createUserRole = function (role, user, cb) {
      user.roleMappings.create({
        principalType: 'USER',
        roleId: role.id,
      }).then(roleMap => {
        console.log(`the role ${role.name} assigned to ${user.email || user.username}`);

        cb && cb(null, roleMap);
      }, console.error);
    };

    UserModel.prototype.changeRole = function (roleOption, cb) {
      let user = this;

      if (!roleOption.newRole) {
        return error.validateError('Fill valid `newRole` key.',
          false,
          {code: `newRole if required.`})
      }

      user.roleMappings.destroyAll().then(roles => {
        user.createRoleByName(roleOption.newRole, cb);
      })
    };

    UserModel.prototype.createRoleByName = function (roleName, cb) {
      let user = this;

      UserModel.app.models.Role.findOrCreate({where: {name: roleName}}, {name: roleName})
        .then(role => {
          user.createUserRole(role[0], user, cb);
        }, console.error);
    };

    UserModel.setter.email = function (value) {
      this.$email = value;
      if (UserModel.settings.resolveGmailAccount && this.$email) {
        var emailObject = this.$email.split('@');

        var gmailCom = 'gmail.com';
        if (emailObject && emailObject.length == 2 && emailObject[1].toLowerCase() === gmailCom) {
          this.$email = [emailObject[0].replace(/\./g, ''), '@', emailObject[1]].join('');

          console.log('after resolveGmailAccount changed: ', this.$email);
        }
      }
    };

    //send password reset link when requested
    UserModel.on('resetPasswordRequest', function (info) {

      UserModel.sendForgotPassword ?
        UserModel.sendForgotPassword(info) :
        console.warn(`sendForgotPassword not implemented in ${UserModel.modelName} model.`);
    });

    /**
     * A method for logging in a user using a time-based (quickly expiring)
     * verification code obtained using the `requestCode()` method.
     *
     * @param  {object}   credentials A JSON object containing "email" and "two factor" fields
     * @param  {Function} cb          The function to call in the Loopback for sending back data
     * @return {void}
     */
    UserModel.loginWithCode = function (ctx, credentials, cb) {
      let inDev = ctx.req.query?.inDev;
      let defaultError = new Error(error.codes.LOGIN_FAILED);
      defaultError.statusCode = 422;

      if ((!credentials.email && !credentials.username) || !credentials.token) {
        defaultError.code = 'CREDENTIAL_REQUIRED';
        defaultError.message += util.format(error.codes.OBJECT_REQUIRED, 'نام کاربری و توکن');

        return cb(defaultError);
      }

      var query = credentials.email ? {email: credentials.email} : {username: credentials.username};
      let filter = {where: query, include: ['roles']};

      this.findOne(filter, function (err, user) {
        if (err) return cb(err);

        if (!user) {
          defaultError.code = 'USER_NOT_FOUND';
          defaultError.message += util.format(error.codes.OBJECT_NOT_FOUND, 'ایمیل یا نام کاربری');
          defaultError.localized = true;

          return cb(defaultError);
        }

        var tokenValidates = inDev ? true : BaseUser.verifyCode(credentials.token);

        if (!tokenValidates) {
          defaultError.code = 'ACTIVE_CODE_INCORRECT';
          defaultError.message += util.format(error.codes.OBJECT_IS_INCORRECT, 'توکن وارد شده');
          defaultError.localized = true;

          return cb(defaultError);
        }

        let data = UserModel.activatedData;
        data.isActive = undefined;
        delete data.isActive;
        UserModel.update({id: user.id}, data, function (err, afftected) {
          if (err) return cb(err);

          user.createAccessToken(settings.ttl).then(token => {
            let roles = user.__cachedRelations.roles;
            if (roles && Array.isArray(roles) && roles.length > 0) {
              user.__data.roleName = roles && roles[0].name;
              user.__data.roles = undefined;
            }

            token.__data.user = user;

            UserModel.emit('loggedInWithCode', {user: user, token: token});

            cb(null, token);
          }, cb);
        });
      });
    };

    UserModel.remoteMethod(
      'loginWithCode',
      {
        description: 'Login a user with email and two-factor code',
        accepts: [
          {arg: "ctx", type: "object", http: {source: "context"}},
          {arg: 'credentials', type: 'Credential', required: true, http: {source: 'body'}},
        ],
        returns: {
          arg: 'accessToken',
          type: 'AccessToken',
          root: true,
          description: 'The response body contains properties of the AccessToken created on login.\n',
        },
        meta: {
          title: 'Login with OTP.',
          subtitle: 'Login with OTP code.',
          permission: {},
          auditLog: {},
          userLog: {},
        },
        http: {verb: 'post'},
      },
    );

    UserModel.authenticate = function (credentials, include, fn) {
      UserModel.login(credentials, ['user', 'roles'], function (err, token) {
        if (err) {
          err.statusCode = 422; // for pass logic error
          return fn(err);
        }

        var user = token.__data.user;
        if (user && !user.isActiveUser())
          return fn(error.validateError(error.codes.ACCOUNT_DEACTIVATE, true, {code: 'USER_NOT_ACTIVE'}));
        console.log(include);
        var needRole = Array.isArray(include) ? include.indexOf('role') > -1 : include === 'role';

        if (settings.mobileVerificationRequired && !user.mobileVerified) {
          return fn(error.validateError(error.codes.MOBILE_NOT_VERIFIED, {code: 'MOBILE_NOT_VERIFIED'}));
        }

        if (!needRole) return fn(null, token);

        UserModel.app.models.RoleMapping.findOne({
          where: {principalId: token.userId},
          include: 'role',
        }, function (err, principal) {
          if (err) return fn(err);

          token.userCode = principal && principal.__data && principal.__data.role.name;

          return fn(null, token);
        });

      });
    };

    UserModel.remoteMethod(
      'authenticate',
      {
        description: 'Login a user with username/email and password.',
        accepts: [
          {
            arg: 'credentials',
            type: 'Credential',
            required: true,
            http: {source: 'body'},
          },
          {
            arg: 'include', type: ['string'], http: {source: 'query'},
            description: 'Related objects to include in the response. ' +
              'See the description of return value for more details.',
          },
        ],
        meta: {
          title: 'User login.',
          subtitle: 'Login with user/password.',
          permission: {},
          auditLog: {},
          userLog: {},
        },
        returns: {
          arg: 'accessToken', type: 'AccessToken', root: true,
          description:
            'The response body contains properties of the {{AccessToken}} created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `user` - `U+007BUserU+007D` - Data of the currently logged in user. ' +
            '{{(`include=user`)}}\n\n',
        },
        http: {verb: 'post'},
      },
    );

    /**
     * Request a two-factor authentication code for use during the login process
     * NOTE: this does NOT send the code anywhere, that is left as an experiment
     *       for the reader of this example code. :)
     *
     * @param  {object}   credentials A JSON object containing "email" and "password" fields
     * @param  {Function} fn          The function to call in the Loopback for sending back data
     * @return {Function}
     */
    UserModel.requestCode = function (credentials, fn) {
      var now = new Date();
      credentials = credentials || {};
      credentials.options = credentials.options || {};
      var defaultError = new Error(error.codes.LOGIN_FAILED);
      defaultError.statusCode = 422;

      if (credentials.mobile && credentials.options.anonymous === true) {
        var token = BaseUser.generateCode();
        let user = new UserModel({mobile: credentials.mobile});

        UserModel.emit('sendRequestCode', {
          sender: this,
          user: user,
          activationCode: token,
        });

        return fn(null, {creationTime: now.getTime(), expireInSecond: step});
      }

      if (!credentials.email && !credentials.username) {
        defaultError.code = 'EMAIL_REQUIRED';
        defaultError.message = util.format(error.codes.OBJECT_REQUIRED, 'ایمیل یا نام کاربری');
        return fn(defaultError);
      }

      var query = credentials.email ? {email: credentials.email} : {username: credentials.username};
      let filter = {where: query};
      this.findOne(filter, function (err, user) {
        if (err) return fn(err);

        if (!user) {
          defaultError.code = 'USER_NOT_FOUND';
          defaultError.message += util.format(error.codes.OBJECT_NOT_FOUND, 'کاربر');
          return fn(defaultError);
        }

        let token = BaseUser.generateCode();

        UserModel.emit('sendRequestCode', {
          sender: this,
          user: user,
          activationCode: token,
        });

        fn(null, {creationTime: now.getTime(), expireInSecond: step});
      });
    };

    UserModel.remoteMethod(
      'requestCode',
      {
        description: 'Request a two-factor code for a user with email and password',
        accepts: [
          {
            arg: 'credentials',
            type: 'Credential',
            required: true,
            http: {source: 'body'},
          },
        ],
        meta: {
          title: 'Request OTP token.',
          subtitle: 'Request a two-factor code.',
          permission: {},
          auditLog: {},
          userLog: {},
        },
        returns: {arg: 'timestamp', type: 'string'},
        http: {verb: 'post'},
      },
    );

    return UserModel;
  };

  /*!
   * Setup the base user.
   */

  BaseUser.setup();

};
