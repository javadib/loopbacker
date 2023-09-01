'use strict';

const url = require('url');

module.exports = function(Model, Options = {}) {

  Model.afterRemote('uploadFile', function(ctx, model, next) {
    ctx.result.forEach(p => p.fileUrl = url.resolve(Model.app.settings.url, p.relativeFileName));

    next();
  });

};
