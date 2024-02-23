module.exports = function(Model, options) {
  Model.beforeRemote(options.methodName, function (ctx, unused, next) {
    var model = ctx.req.body || ctx.args.data;
    var id = ctx.req.params.id;
    var fk = ctx.req.params.fk;

    delete model.CreatedOn;

    model[options.id] = id;
    model[options.foreignKey] = fk;

    next();

  });
};

