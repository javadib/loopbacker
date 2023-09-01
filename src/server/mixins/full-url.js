'use strict';

const url = require('url');

module.exports = function(Model, options) {
  const L = (msg) => console.log(msg);

  let keys = Object.keys(options.fields);

  if (!keys || keys.length <= 0) {
    let msg = `${Model.modelName}: There is no fields option in mixin. Review the 'FullUrl' mixin.`;
    return L(msg);
  }

  const getBaseUrl = function() {
    return options.baseUrl ||
      Model.app.settings[options.appSettingsKey] ||
      Model.app.settings.url;
  };

  let patchUrl = function(data) {
    let baseUrl = getBaseUrl();

    keys.forEach(key => {
      const field = options.fields[key];
      let name = field.fullName || key;

      if (data && data[key]) {
        if (field.isArray) {
          let arr = Array.isArray(data[name]) ? data[name] : JSON.parse(data[name]);

          data[name] = arr.map(p => url.resolve(baseUrl, p));
        } else {
          data[name] = url.resolve(baseUrl, data[key] || '');
        }
      }
    });
  };

  Model.observe('loaded', function(ctx, next) {
    let data = ctx.instance || ctx.data;

    patchUrl(data);

    next();
  });

  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance) {
      ctx.instance.unsetAttribute('options');
    } else {
      delete ctx.data.options;
    }

    next();
  });

  Model.observe('after save', function(ctx, next) {

    patchUrl(ctx.instance);

    next();
  });

  Model.afterRemote('**', function(ctx, model, next) {

    if (model && model.__data) {
      patchUrl(model.__data);

      Object.keys(model.__data)
        .filter(k => typeof model.__data[k] === 'object')
        .forEach(k => patchUrl(model.__data[k]))

    }

    next();
  });
};
