'use strict';
const uploadUtil = require('../../common/utils/upload-util');

module.exports = function(Model, options) {
  options.keepValue = options.keepValue || true;

  let methods = Array.isArray(options.methodName) ?
    options.methodName : [options.methodName];

  Model.fieldDefaultValue = function(model, field, value) {
    let lModel = Model.app.models[model];
    let properties = lModel.definition.properties;

    let result = value === "{default}" ? properties[field].default : value;

    return result;

  };
  methods.forEach(methodName => {
    Model.beforeRemote(methodName, function(ctx, unused, next) {
      let req = ctx.req;
      let uploadOptions = options.options || {};
      let storage = Model.app.dataSources[options.storage];

      if (!req.files) return next();

      uploadUtil.saveFiles(req, storage, uploadOptions, function(err, result) {
        if (err) return next(err);

        let body = ctx.args.data || req.body;
        body.options = body.options || {};
        let delKeys = uploadOptions.deleteKeys || ['$delete$'];
        let properties = Model.definition.properties;
        let fields = options.fields === '*' ?
          Object.keys(properties) : options.fields || [];
        let filedDefualt = options.default || {};

        fields.forEach(key => {
          let file = result[key];
          let additionalData = file && file.additionalData;
          let beDeleted = delKeys.indexOf(body[key]) >= 0;

          if (beDeleted) {
            body[key] = Model.fieldDefaultValue(
              filedDefualt.model, key, filedDefualt.value);

            return;
          }

          body[key] = file ? (file.relativeFileName || file.fileName) :
            options.keepValue ? body[key] : undefined;

          // if (additionalData) {
          //   body.options[key] = additionalData;
          // }
        });

        next();
      });

    });
  });

  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance) {
      ctx.instance.unsetAttribute('options');
    } else {
      ctx.data.options = undefined;
    }

    next();
  });

};
