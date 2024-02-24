'use strict';

const async = require('async');

module.exports = function (Model, Options) {
  let {remote = true} = Options.methods;
  Options.limit = Options.limit || 10;
  Options.methodName = Options.methodName || 'search';
  const settings = Model.definition.settings;

  Model.getRelationKeys2 = function (types = []) {
    let relations = settings.relations || {};

    return Object.keys(relations)
      .filter(key => types.indexOf(relations[key].type) >= 0)
      .map(p => p);
  };

  //entry point
  let {relations = {}} = Options;
  let relKeys = relations === '*' || relations === 'all' ?
    Model.getRelationKeys2(['hasMany', 'referencesMany']) :
    Object.keys(relations).filter(key => relations[key]);

  relKeys.forEach(key => {
    let httpPath = `/${key}/${Options.methodName}`;
    let methodName = `__${Options.methodName}__${key}`;
    let relation = settings.relations[key];

    if (!relation) {
      let msg = `the '${key}' relation not defined in '${Model.modelName}' model!`;
      throw new Error(msg);
    }

    let filter = {where: {or: []}};
    let method = Options.relations[key]?.method || filter;
    method.path = httpPath;

    Model.prototype[methodName] = function (ctx, keywords, cb) {
      let model = this;
      let lFilter = Object.assign({}, filter);

      if (keywords && method.or) {
        let orClause = Model.buildOrClause(method, keywords);

        lFilter.where.or = orClause;
      }

      if (lFilter.where.or.length <= 0) {
        delete lFilter.where.or;
      }

      if (method.fields) {
        lFilter.fields = method.fields;
      }

      model[`__findWithPagination__${key}`](ctx, lFilter, cb && cb);
    };

    Model.remoteMethod(
      methodName, {
        isStatic: false,
        description: 'search model with keyword',
        http: {path: httpPath, verb: 'get'},
        accepts: [
          {arg: 'ctx', type: 'object', http: {source: 'context'}},
          {arg: 'keywords', type: 'string', required: true, http: {source: 'query'}},
        ],
        returns: {
          arg: 'result', type: relation.model, root: true, description: 'List of matches keyword result set.',
        }
      }
    );
  });
};

