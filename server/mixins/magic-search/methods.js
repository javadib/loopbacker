'use strict';

const async = require('async');
const {func} = require("joi");

module.exports = function (Model, options) {
  options.limit = options.limit || 10;
  options.methodName = options.methodName || 'search';

  Model.buildOrClause = function (method, keyword) {
    let orString = JSON.stringify(method.or);
    let orClause = orString.replace(/{keyword}/g, keyword);
    let or = JSON.parse(orClause);

    return Object.keys(or).map(key => {return {[key]: or[key]}});
  };

  Model.buildSearch = function (key, method, filter, opt = {remote: true}) {
    let httpPath = method.path || key;

    Model[key] = function (keyword, cb) {
      if (keyword && method.or) {
        let orClause = Model.buildOrClause(method, keyword);

        filter.where.or = orClause;
      }

      if (method.fields) {
        filter.fields = method.fields;
      }

      Model.findWithPagination({}, filter, cb && cb);
    };

    if (opt.remote) {
      Model.remoteMethod(
        key, {
          isStatic: true,
          description: 'search model with keyword',
          http: {path: `/${httpPath}`, verb: 'get'},
          accepts: [
            {
              arg: 'keyword', type: 'string', required: true, http: {source: 'query'},
            },
          ],
          returns: {
            arg: 'result', type: Model, root: true, description: 'List of matches keyword result set.',
          }
        }
      );
    }
  }


};

