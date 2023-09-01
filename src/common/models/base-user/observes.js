'use strict';

module.exports = (BaseUser) => {

  // on login set access_token cookie with same ttl as loopback's accessToken
  BaseUser.afterRemote('authenticate', function setLoginCookie(context, accessToken = {}, next) {
    let res = context.res;
    let req = context.req;
    let token = accessToken.id;
    let options = context.options || {};
    let redirectTo = options.redirect || '/';

    if (token !== null) {
      req.accessToken = accessToken;
      req.afterAuthenticate = true;

      res.cookie('access_token', token, {
        // signed: req.signedCookies ? true : false,
        signed: req.signedCookies,
        maxAge: 1000 * accessToken.ttl,
      });

      return res.redirect(redirectTo);
    }

    return next();
  });

  BaseUser.afterRemote('logout', function(context, result, next) {
    let res = context.res;

    res.clearCookie('access_token');
    res.clearCookie('userId');

    return next();
  });

};