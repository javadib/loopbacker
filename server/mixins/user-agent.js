'use strict';

module.exports = function (Model, options) {
  let validModes = ['create', 'update', 'both'];

  options.mode = options.mode || validModes[0];
  options.fields = options.fields || {};
  options.fields.userIp = options.fields.userIp || 'userIp';
  options.fields.userAgent = options.fields.userAgent || 'userAgent';

  let checkMode = function () {
    let isInList = validModes.indexOf(options.mode) >= 0;

    if (!isInList) {
      throw new Error(`valid mode should be in list:  ${validModes}`);
    }
  };

  let updateModel = function (model, cb) {
    model[options.fields.userIp] = Model.app.locals.userIp;
    model[options.fields.userAgent] = Model.app.locals.userAgent;

    cb && cb();
  };

  checkMode();

  Model.observe('before save', function (ctx, next) {
    const data = ctx.data;
    const options = ctx.options || {};
    const model = ctx.instance || ctx.currentInstance;
    const isNewInstance = ctx.isNewInstance === true || (ctx.instance);

    if (options.mode === "both") return updateModel(model, next);

    if (options.mode === "create" && isNewInstance) {
      updateModel(model, next);
    }
    else {
      updateModel(model, next);
    }
  });
};
