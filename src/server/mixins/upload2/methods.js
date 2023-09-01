'use strict';

const uploadUtil = require('../../../common/utils/upload-util2');

module.exports = function(Model, Options = {}) {

  Model.getDefaultValue = function(model, field, value) {
    let lModel = Model.app.models[model];
    let properties = lModel.definition.properties;

    let result = value === '{default}' ? properties[field].default : value;

    return result;
  };

  Model.uploadFile = function(ctx, cb) {
    let req = ctx.req;
    let storage = Model.app.dataSources[Options.storage];

    if (!req.files) return cb && cb(new Error('There is not file in request.'));

    return uploadUtil.saveFiles(ctx.req, storage, Options, (err, result) => {
      if (err) return cb(err);

      result.forEach(file => {
        file.fileName = undefined;
        if (file.additionalData) {
          file.metadata = Object.assign({}, file.additionalData);
          delete file.additionalData;

          if (file.metadata.buffer) {
            file.metadata.buffer = undefined;
          }
        }
      });

      return cb && cb(null, result);
    });
  };

  Model.remoteMethod('uploadFile', {
      isStatic: true,
      description: 'Upload media in storage.',
      http: {path: '/uploadFile', verb: 'post'},
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
      ],
      returns: {arg: 'result', type: 'object', root: true, description: ''},
    },
  );
};
