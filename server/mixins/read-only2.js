'use strict';

module.exports = function (Model, Options) {
  let {excludeMethods = {}} = Options;
  let logger = Options.logger || false;

  const L = (msg, ...args) => {
    if (logger) {
      console.log(msg, args);
    }
  };

  L('ReadOnly mixin for Model %s', Model.modelName);
  let defaultDisableRemotes = [
    'create', // Removes (POST)
    'upsert', // Removes (PUT)
    'deleteById', // Removes (DELETE)
    'updateAll', // Removes (POST)
    'prototype.updateAttributes', // Removes (PUT)
    'createChangeStream'
  ];

  let remoteMethods = Options.remoteMethods;
  if (remoteMethods) {
    let disableRemotes = Array.isArray(remoteMethods) ? remoteMethods : defaultDisableRemotes;

    disableRemotes.forEach(m => Model.disableRemoteMethodByName(m));
  }

  function stripReadOnlyProperties(method, body, next) {
    if (!body) return next();

    let isExclude = method.name.indexOf(Object.keys(excludeMethods));

    if (isExclude) return next();

    let properties = (Object.keys(Options.properties || Options).length) ? Options : null;

    if (!properties) return next();

    L('Creating %s : Read only properties are %j', Model.modelName, properties);
    Object.keys(properties).forEach(function (key) {
      L('The \'%s\' property is read only, removing incoming data', key);
      delete body[key];
    });

    return next();
  }

  Model.beforeRemote('**', function (ctx, modelInstance, next) {
    let body = ctx.req.body;

    stripReadOnlyProperties(ctx.method, body, next);
  });
};
