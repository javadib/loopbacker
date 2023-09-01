'use strict';

module.exports = function (Model, Options) {
  let {remote = true} = Options.methods;

  Model.buildOrClause = function (method, keyword) {
    let orString = JSON.stringify(method.or);
    let orClause = orString.replace(/{keyword}/g, keyword);
    let or = JSON.parse(orClause);

    return Object.keys(or).map(key => {return {[key]: or[key]}});
  };

  Object.keys(Options.methods).forEach(key => {
    let method = Options.methods[key];
    let httpPath = method.path || key;

    let filter = {where: {or: []}};
    Model[key] = function (keyword, cb) {
      if (keyword && method.or) {
        let orClause = Model.buildOrClause(method, keyword);

        filter.where.or = orClause;
      }

      if (method.fields) {
        filter.fields = method.fields;
      }

      Model.find(filter, cb && cb);
    };

    if (remote) {
      Model.remoteMethod(
          key, {
            isStatic: true,
            description: 'search model with keyword',
            http: {path: `/${httpPath}`, verb: 'get'},
            accepts: [
              {
                arg: 'keyword', type: 'string', required: false, http: {source: 'query'},
              },
            ],
            returns: {
              arg: 'result', type: Model, root: true, description: 'List of matches keyword result set.',
            }
          }
      );
    }

  })

};
