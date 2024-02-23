'use strict';

module.exports = function(Audit) {
  var isStatic = true;

  Audit.disableRemoteMethodByName('create', isStatic);
  Audit.disableRemoteMethodByName('updateById', isStatic);
  Audit.disableRemoteMethodByName('updateAttributes', !isStatic);
  Audit.disableRemoteMethodByName('deleteById', isStatic);
  Audit.disableRemoteMethodByName('replaceById', isStatic);
  Audit.disableRemoteMethodByName('replaceOrCreate', isStatic);
  Audit.disableRemoteMethodByName('updateAll', isStatic);
  Audit.disableRemoteMethodByName('upsertWithWhere', isStatic);
};
