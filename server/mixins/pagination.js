'use strict';

const async = require('async');

module.exports = function(Model, options) {

  require('./pagLib/header')(Model, options);
  require('./pagLib/relation')(Model, options);
  require('./pagLib/scopes')(Model, options);

  options.methodName = options.methodName || 'findWithPagination';

  Model.findWithPagination = function(ctx, filter = {}, cb) {
    filter.limit = filter.limit || options.limit;

    async.parallel({
      totalCount: function(callback) {
        Model.count(callback);
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
    'findWithPagination', {
      description: 'Find all instances of the model matched by filter from the data source.',
      http: {path: `/${options.methodName}`, verb: 'get'},
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
};

