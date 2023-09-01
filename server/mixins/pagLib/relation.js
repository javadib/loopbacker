'use strict';

const async = require('async');

module.exports = function(Model, options) {
  options.limit = options.limit || 10;
  options.methodName = options.methodName || 'findWithPagination';
  const settings = Model.definition.settings;

  Model.getRelationKeys = function(type) {
    let relations = settings.relations || {};

    return Object.keys(relations)
      .filter(key => relations[key].type === type)
      .map(p => p);
  };

  Model.getRelationKeys2 = function(types = []) {
    let relations = settings.relations || {};

    return Object.keys(relations)
      .filter(key => types.indexOf(relations[key].type) >= 0)
      .map(p => p);
  };

  let {relations = {}} = options;
  let relKeys = relations === '*' || relations === 'all' ?
    Model.getRelationKeys2(['hasMany', 'referencesMany']) :
    Object.keys(relations).filter(key => relations[key]);

  //entry point
  relKeys.forEach(key => {
    let httpPath = `/${key}/${options.methodName}`;
    let methodName = `__${options.methodName}__${key}`;
    let relation = settings.relations[key];

    if (!relation) {
      let msg = `the '${key}' relation not defined in '${Model.modelName}' model!`;
      throw new Error(msg);
    }

    Model.prototype[methodName] = function(ctx, filter = {}, cb) {
      let model = this;
      filter.where = filter.where || {};
      let fkModel = Model.app.models[relation.model];
      let fkModelCount = Model.app.models[relation.through || relation.model];
      // filter.where[relation.foreignKey] = ctx.ctorArgs && ctx.ctorArgs.id;
      filter.limit = filter.limit || options.limit;

      async.parallel({
        totalCount: function(callback) {
          fkModel.count(callback);
        },
        filteredCount: function(callback) {
          model[key].count(filter.where, callback);
        },
        data: function(callback) {
          model[key].find(filter, callback);
        },
      }, function(err, result) {
        if (err) return cb && cb(err);

        let res = {
          totalCount: result.totalCount,
          filteredCount: result.filteredCount,
          data: result.data,
        };

        if (options.header) {
          let fkOptions = fkModel.definition.settings.mixins.Pagination;
          res.headers = Model.makeHeaders(fkModel, fkOptions, filter);
        }

        cb && cb(null, res);
      });
    };

    Model.remoteMethod(
      methodName, {
        isStatic: false,
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
          type: relation.model,
          root: true,
          description: 'Find all instances of the model matched by filter from the data source.',
        },
      }
    );

  });
};

