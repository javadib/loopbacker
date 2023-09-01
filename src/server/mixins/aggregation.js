'use strict';
const _ = require('lodash');

module.exports = function(Model, options) {

  function transformDates(match) {
    Object.keys(match).forEach(key => {
      let value = match[key];

      if (value instanceof Object) transformDates(value);

      if (typeof value === 'string' && value.match(/$.*$/)) {
        let args = value.substring(1, value.length - 1);
        match[key] = new Date(args);
      }

    });
  }

  Model.groupBy = function(ctx, key, cb) {
    let f = {"aggregation" : [{"$group": {"_id": `\$${key}`,"groups":{"$push":"$$ROOT"}}}]}

    return Model.aggregate(ctx, f, cb);
  };

  Model.remoteMethod(
    'groupBy', {
      isStatic: true,
      description: 'groupBy the data with specific key.',
      http: {path: '/groupBy/:key', verb: 'get'},
      meta: {
        subtitle: 'groupBy the series data.',
        title: 'groupBy Data.',
        permission: {},
        auditLog: {},
        userLog: {}
      },
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'key', type: 'string', required: true, http: {source: 'path'}},
      ],
      returns: {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'Result of groupBy data.',
      },
    },
  );



  Model.aggregate = function(ctx, filter = {}, cb) {
    const collection = Model.getDataSource().connector.collection(Model.modelName);
    let allowExtendedOperators = filter.allowExtendedOperators || true;
    let aggregation = filter.aggregation || [];

    let match = Array.isArray(aggregation) ? aggregation.find(p => p['$match']) : aggregation;
    match = match && match['$match'];

    if (match) {
      transformDates(match);
    }

    const cursor = collection.aggregate(aggregation, {allowExtendedOperators: allowExtendedOperators});

    return cursor.get(cb);
  };

  Model.remoteMethod(
    'aggregate', {
      isStatic: true,
      description: 'Aggregate the data.',
      http: {path: '/aggregate', verb: 'get'},
      meta: {
        subtitle: 'Aggregate the series data.',
        title: 'Data Aggregation.',
        permission: {},
        auditLog: {},
        userLog: {}
      },
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
        type: 'object',
        root: true,
        description: 'Result of aggregation data.',
      },
    },
  );

  Model.dateSeries = function(ctx, field, filter = {}, cb) {
    let op = {
      'aggregation':
        [
          {
            '$group': {
              '_id': {
                '$dateToString': {
                  'format': '%Y-%m-%d',
                  'date': `$${field}`,
                },
              },
              [filter.sum || 'sum']: {
                '$sum': 1,
              },
            },
          },
          {
            '$sort': {
              '_id': -1,
            },
          },
        ],
    };

    if (filter.match) {
      op.aggregation.push({
        '$match': filter.match,
      });
    }

    if (filter.project) {
      op.aggregation.push({
        '$project': filter.project,
      });
    }

    if (filter.sort) {
      op.aggregation.push({
        '$sort': filter.sort,
      });
    }

    Model.aggregate(ctx, op, cb && cb);
  };

  Model.remoteMethod(
    'dateSeries', {
      isStatic: true,
      description: 'Fetch data per date series.',
      http: {path: '/dateSeries/:field', verb: 'get'},
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'field', type: 'string', required: true, http: {source: 'path'}},
        {
          arg: 'filter',
          type: 'object',
          required: false,
          http: {source: 'query'},
        },
      ],
      returns: {
        arg: 'result',
        type: 'object',
        root: true,
        description: 'DateSeries data to visualization.',
      },
    },
  );

};

// {
//   "aggregation": [
//   {
//     "$match": {
//       "createdOn": {
//         "$gt": "$2019-01-03T00:11:43.964+0000$",
//         "$lt": "$2019-01-04T00:00:00.000+0000$"
//       }
//     }
//   },
//   {
//     "$group": {
//       "_id": {
//         "$dateToString": {
//           "format": "%Y-%m-%d",
//           "date": "$createdOn"
//         }
//       },
//       "sum": {
//         "$sum": 1
//       }
//     }
//   },
//   {
//     "$project": {
//       "date": "$_id",
//       "sum": 1,
//       "_id": 0
//     }
//   },
//   {
//     "$sort": {
//       "date": 1
//     }
//   }
// ]
// }
