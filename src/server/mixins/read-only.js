'use strict';

module.exports = function(Model, options) {

  console.log('ReadOnly mixin for Model %s', Model.modelName);

  function stripReadOnlyProperties(body, next) {
    if (!body) {
      return next();
    }

    var properties = (Object.keys(options).length) ? options : null;
    if (properties) {
      console.log('Creating %s : Read only properties are %j', Model.modelName, properties);
      Object.keys(properties).forEach(function(key) {
        console.log('The \'%s\' property is read only, removing incoming data', key);
        delete body[key];
      });
      next();
    } else {
      var err = new Error('Unable to update: ' + Model.modelName + ' is read only.');
      err.statusCode = 403;
      next(err);
    }
  }

  Model.beforeRemote('**', function(ctx, modelInstance, next) {
    var body = ctx.req.body;

    stripReadOnlyProperties(body, next);
  });
};
