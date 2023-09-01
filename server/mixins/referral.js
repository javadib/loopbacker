'use strict';

const url = require('url');
const path = require('path');

module.exports = function(Model, Options) {
  const L = (msg) => console.log(msg);
  const referKey = Options.key;

  if (!referKey) {
    let msg = `${Model.modelName}: There is no fields option in mixin. Review the 'referral' mixin.`;
    return L(msg);
  }

  if (!Options.url || !Options.url.path) {
    let moduleName = path.parse(module.filename).name;
    return console.error(`${moduleName} Mixins: Please Specify url path.`)
  }

  Model.prototype.buildPath = function (urlPath) {
    let model = this;

    Object.keys(model.__data || model).forEach(key => {
      let pattern = new RegExp(`:${key}`, 'g');

      urlPath = urlPath.replace(pattern, String(model[key]));
    });

    return urlPath;
  };

  Model.prototype.getReferUrl = function() {
    let model = this;
    let path = model.buildPath(Options.url.path);
    let baseUrl = Model.app.getBaseUrl();
    let referUrl = url.resolve(baseUrl, path);

    return referUrl;
  };

  Model.observe('before save', function(ctx, next) {
    let options = ctx.options || {};
    let instanceOrData = ctx.instance || ctx.data;
    let instance = ctx.instance || ctx.currentInstance;
    let isNewInstance = ctx.isNewInstance === true;

    if (options.refer) {
      instanceOrData[referKey] = options.refer.id;
    }

    next();
  });

  Model.observe('after save', function(ctx, next) {
    let options = ctx.options || {};
    let instanceOrData = ctx.instance || ctx.data;
    let instance = ctx.instance || ctx.currentInstance;
    let isNewInstance = ctx.isNewInstance === true;

    let referProp = instanceOrData[referKey];
    if (referProp) {
      //TODO: send email

      Model.emit('referral.saved', {ctx: ctx});
    }

    next();
  });
};
