'use strict';

const util = require('util');
const url = require("url");
const path = require("path");

const error = require('../../common/utils/error-provider');

module.exports = function (Model, options) {

  Model.updateModel = function (ctx, id, cb) {
    let parse = url.parse(ctx.req.url);
    let methodName = path.basename(parse.pathname);
    let inject = Model.settings.mixins.Inject.find(m => m.method.name === methodName);
    let data = Object.assign({}, inject.method.updateTo) || {};
    let options = Object.assign({}, inject.method.options) || {};

    Model.update({id: id}, data, options, (err, result) => {
      Model.emit('modelUpdated', {
        err: err,
        result: result,
        Model: Model,
        methodName: methodName,
        id: id
      });
      cb && cb(err, result);
    });
  };

  Model.remoteMethod('updateModel', {
    description: options.method.description,
    http: options.method.http,
    accepts: [
      {arg: "ctx", type: "object", http: {source: "context"}},
      {arg: "id", type: "string", required: true}
    ],
    returns: {arg: "count", type: "Number", root: true, description: "number of item affected."}
  });
};
