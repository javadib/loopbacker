module.exports = function(Model, options = {}) {
  Model.activateEmitName = 'activate';
  options.fieldName = options.fieldName || 'isActive';
  options.activeRemoteMethodName = options.activeRemoteMethodName || 'active';
  options.inactiveRemoteMethodName = options.inactiveRemoteMethodName || 'inactive';

  Model.prototype.active = function (ctx, cb) {
    let data = {[options.fieldName]: true};
    this.updateAttributes(data)
        .then(model => {
          Model.emit(Model.activateEmitName, {model: model, data: data});

          cb && cb(null, model);
        })
        .catch(cb);
  };

  Model.remoteMethod(
      'active', {
        isStatic: false,
        description: 'Active the specific model.',
        http: {"path": `/${options.activeRemoteMethodName}`, verb: 'post'},
        accepts: [
          {arg: 'ctx', type: 'object', http: {source: 'context'}}
        ],
        returns: {arg: 'result', type: Model, root: true, description: 'Return the activate model.'}
      }
  );

  Model.prototype.inactive = function (ctx, cb) {
    let data = {[options.fieldName]: false};
    this.updateAttributes(data)
        .then(model => {
          Model.emit(Model.activateEmitName, {model: model, data: data});
          cb && cb(null, model);
        })
        .catch(cb);
  };

  Model.remoteMethod(
      'inactive', {
        isStatic: false,
        description: 'Inactive the specific model.',
        http: {"path": `/${options.inactiveRemoteMethodName}`, verb: 'post'},
        accepts: [
          {arg: 'ctx', type: 'object', http: {source: 'context'}}
        ],
        returns: {arg: 'result', type: Model, root: true, description: 'Return the inactive model.'}
      }
  );

};

