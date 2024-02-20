module.exports = function (Model, options = {}) {
  let {scope} = options;
  let {mapper = {}} = options;
  let {system = "system"} = mapper;
  let props = Model.definition.properties;
  let settings = Model.definition.settings;

  if (!props[system]) {
    Model.defineProperty(system, {type: 'boolean', default: false})
  }

  if (options.hidden) {
    settings.hidden.push(system);
  }

  Model.observe('before save', function (ctx, next) {
    let data = ctx.data;
    let instance = ctx.currentInstance;
    const isNewInstance = ctx.isNewInstance === true || (ctx.instance);

    let isSystem = !isNewInstance &&
        instance &&
        instance[system] === true &&
        !options.canUpdate;
    if (isSystem) {
      let err = new Error('item cannot be updated.');
      err.code = 422;
      err.statusCode = 422;

      return next(err);
    }

    next();
  });

  Model.observe('before delete', function (ctx, next) {
    Model.find({where: ctx.where}).then((models = []) => {
      let systemItems = models.filter(p => p[system] === true);
      let canDelete = systemItems.length > 0 && !options.canDelete;

      if (canDelete) {
        let err = new Error('item cannot be deleted.');
        err.code = 422;
        err.statusCode = 422;

        return next(err);
      }

      next();
    });
  });

};

