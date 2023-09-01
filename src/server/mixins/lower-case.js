'use strict';

module.exports = function(Model, options) {
  Model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance) {
      var model = ctx.instance;
      var keys = Object.keys(model.__data);

      var toLowers = keys.filter(p => model[p] && options[p] === true);
      toLowers.forEach(p => {
        var prop = model[p];

        model[p] = prop.toLowerCase();
      })
    }

    next();
  });
};
