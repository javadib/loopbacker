'use strict';

const async = require('async');

module.exports = function (Model, options) {
  options.limit = options.limit || 10;
  options.methodName = options.methodName || 'findWithPagination';
  const settings = Model.definition.settings;

  Model.getRelationKeys = function (type) {
    let scopes = settings.scopes || {};

    return Object.keys(scopes)
      .filter(key => scopes[key].type === type)
      .map(p => p);
  };

  Model.getRelationKeys2 = function (types = []) {
    let scopes = settings.scopes || {};

    return types.filter(key => scopes[key])
  };

  let {scopes = {}} = options;
  let relKeys = scopes === '*' || scopes === 'all' ?
    Object.keys(settings.scopes || {}) :
    Object.keys(scopes).filter(key => scopes[key]);

  //entry point
  relKeys.forEach(key => {
    let httpPath = `/${key}/${options.methodName}`;
    let methodName = `__${options.methodName}__${key}`;
    let scope = settings.scopes[key];

    if (!scope) {
      let msg = `the '${key}' scope not defined in '${Model.modelName}' model!`;
      throw new Error(msg);
    }

    Model[methodName] = function(ctx, filter = {}, cb) {
      filter = Object.assign(filter, scope);
      filter.limit = filter.limit || options.limit;

      async.parallel({
        totalCount: function(callback) {
          Model[`__count__${key}`](callback);
        },
        filteredCount: function(callback) {
          Model.count(filter.where, callback);
        },
        data: function(callback) {
          Model.find(filter, callback);
        },
      }, function(err, result) {
        if (err) return cb(err);

        let res = {
          totalCount: result.totalCount,
          filteredCount: result.filteredCount,
          data: result.data,
        };

        if (options.header) {
          res.headers = Model.makeHeaders(Model, options, filter);
        }

        cb(null, res);
      });

    };

    Model.remoteMethod(
      methodName, {
        description: 'Find all instances of the model matched by filter from the data source.',
        http: {path: httpPath, verb: 'get'},
        accepts: [
          {arg: 'ctx', type: 'object', http: {source: 'context'}},
          {
            arg: 'filter',
            type: 'object',
            required: false,
            http: {source: 'query'},
          },
        ],
        returns: {
          arg: 'result',
          type: Model,
          root: true,
          description: 'Find all instances of the model matched by filter from the data source.',
        },
      }
    );

  });
};

