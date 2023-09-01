'use strict';

const uploadUtil = require('../../common/utils/upload-util2');

module.exports = function(Model, Options) {
  require('./upload2')(Model, Options);

  Options.keepValue = Options.keepValue || true;

  let methods = Array.isArray(Options.methodName) ?
    Options.methodName : [Options.methodName];

  methods.forEach(methodName => {
    Model.beforeRemote(methodName, function(ctx, unused, next) {
      let req = ctx.req;
      let storage = Model.app.dataSources[Options.storage];

      if (!req.files) return next();

      for (let i = 0; i < req.files.length; i++) {
        req.files[i].id = i;
      }

      uploadUtil.saveFiles(req, storage, Options, function(err, result) {
        if (err) return next(err);

        let body = ctx.args.data || req.body;
        // body.options = body.options || {};
        let delKeys = Options.deleteKeys || ['$delete$'];
        let properties = Model.definition.properties;
        let fields = Options.fields === '*' ?
          Object.keys(properties) : Object.keys(Options.fields) || [];

        fields.forEach(key => {
          let files = result.filter(p => p.key === key);

          if (files.length > 1) {
            let field = Options.fields[key];
            let fileNames = files.map(p => p.relativeFileName || p.fileName);

            if (field.isArray) {
              Array.isArray(body[key]) ? body[key].concat(fileNames) :
                body[key] = fileNames;
            } else {
              body[key] = fileNames[fileNames.length -1];
            }
          } else {
            files = files[files.length -1];
            let beDeleted = delKeys.indexOf(body[key]) >= 0;

            if (beDeleted) {
              body[key] = Model.getDefaultValue(Options.model, key, Options.value);
            } else {
              let urlFileName = files ? (files.relativeFileName || files.fileName) :
                Options.keepValue ? body[key] : undefined;

              if (urlFileName) {
                let field = Options.fields[key];
                if (field.isArray) {
                  Array.isArray(body[key]) ? body[key].push(urlFileName) :
                    body[key] = [urlFileName];
                } else {
                  body[key] = urlFileName;
                }
              }
            }
          }
        });

        next();
      });

    });
  });

  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance) {
      ctx.instance.unsetAttribute('options');
    } else {
      delete ctx.data.options;
    }

    next();
  });

};
