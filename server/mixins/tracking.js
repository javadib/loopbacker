'use strict';

module.exports = function(Model, options) {
  Model.observe('before save', function(ctx, next) {
    const model = ctx.instance || ctx.data;
    const currentDate = new Date();
    let app = Model.app;
    const userId = ctx.options.userId || app.locals.userId;
    const keepId = ctx.options.keepId === true ||
      (ctx.Model.definition.settings?.keepId === true);

    if (ctx.isNewInstance) {
      model.createdBy = userId;
      model.createdOn = currentDate;
      model.id = keepId ? model.id : undefined;
    }

    model.lastModifiedOn = currentDate;
    model.lastModifiedBy = userId;

    next();
  });
};

