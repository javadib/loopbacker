'use strict';

const util = require('util');
const async = require('async');

module.exports = function(Model, Options) {
  Model.beforeRemote('create', function(ctx, unused, next) {
    let body = ctx.req.body;

    if (body.details) {
      let details = Array.isArray(body.details) ? body.details : JSON.parse(body.details);
      ctx.args.options.detailsModel = details;

      delete body.details;
    }

    next();
  });

  Model.afterRemote('create', function(ctx, model, next) {

    if (model.__cachedRelations && model.__cachedRelations.details) {
      ctx.result.__data.details = model.__cachedRelations.details;
    }

    next();
  });

  Model.beforeRemote('prototype.patchAttributes', function(ctx, unused, next) {
    let body = ctx.req.body;

    if (body.details) {
      let details = Array.isArray(body.details) ? body.details : JSON.parse(body.details);
      ctx.args.options.detailsModel = details;

      delete body.details;
    }

    next();
  });

  function pushToResult(ctx, cb) {
    return (err, data) => {
      if (err) return cb(err);

      ctx.result.__data.details = ctx.result.__data.details || [];
      ctx.result.__data.details.push(data);

      cb();
    };
  }

  Model.afterRemote('prototype.patchAttributes', function(ctx, model, next) {
    let detailsModel = ctx.args.options.detailsModel;

    async.each(detailsModel, (item, cb) => {
      let details = ctx.instance.details;

      return item.id ?
        details.updateById(item.id, item, pushToResult(ctx, cb)) :
        details.create(item, pushToResult(ctx, cb));
    }, (err) => {
      if (err) return next(err);

      return next();
    });
  });

  Model.observe('after save', function(ctx, next) {
    let data = ctx.data;
    let options = ctx.options || {};
    let instanceOrData = ctx.instance || ctx.data;
    let instance = ctx.instance || ctx.currentInstance;
    let isNewInstance = ctx.isNewInstance === true;

    if (ctx.isNewInstance) {
      if (options.detailsModel) {
        return ctx.instance.details.create(options.detailsModel, next);
      }
    }

    next();
  });
};
