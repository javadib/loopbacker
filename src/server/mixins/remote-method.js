"use strict";

const util = require('util');

module.exports = function (Model, options = {}) {
  options.disable = options.disable || {};
  Model.relationMethods = [
    {name: "prototype.__get__%s", mode: "read"},
    {name: "prototype.__findById__%s", mode: "read"},
    {name: "prototype.__find__%s", mode: "read"},
    {name: "prototype.__count__%s", mode: "read"},
    {name: "prototype.__exists__%s", mode: "read"},
    {name: "prototype.__create__%s", mode: "write"},
    {name: "prototype.__upsert__%s", mode: "write"},
    {name: "prototype.__updateById__%s", mode: "write"},
    {name: "prototype.__link__%s", mode: "write"},
    {name: "prototype.__unlink__%s", mode: "delete"},
    {name: "prototype.__delete__%s", mode: "delete"},
    {name: "prototype.__destroyById__%s", mode: "delete"}
  ];
  Model.hideRelationMethods = function (name) {
    Model.relationMethods.forEach(item => {
      let format = util.format(item.name, name);
      Model.disableRemoteMethodByName(format);
    })
  };

  Model.disableReadRelationMethods = function (name) {
    Model.relationMethods
        .filter(p => p.mode === "read")
        .forEach(item => {
          let format = util.format(item.name, name);
          Model.disableRemoteMethodByName(format);
        })
  };

  Model.disableWriteRelationMethods = function (name) {
    Model.relationMethods
        .filter(p => p.mode === "write")
        .forEach(item => {
          let format = util.format(item.name, name);
          Model.disableRemoteMethodByName(format);
        })
  };

  Model.disableDeleteRelationMethods = function (name) {
    Model.relationMethods
        .filter(p => p.mode === "delete")
        .forEach(item => {
          let format = util.format(item.name, name);
          Model.disableRemoteMethodByName(format);
        })
  };


  Model.disableRemoteList = function (list = []) {
    list.forEach(p => Model.disableRemoteMethodByName(p));
  };


  Model.disableRemoteList(options.disable.list);


  Model.disableMode = {
    "*": Model.hideRelationMethods,
    "hide": Model.hideRelationMethods,
    "read": Model.disableReadRelationMethods,
    "write": Model.disableWriteRelationMethods,
    "delete": Model.disableDeleteRelationMethods,
  };

  if (options.disable.list) {
    Model.disableRemoteList(options.disable.list)
  }

  let regExp = options.disable.regExp;
  if (regExp) {
    Model.sharedClass.methods()
        // .filter(p => p.name.match(regExp))
        .forEach(item => {
      let match = item.name.match(regExp) || [];

      if (match.length > 0) {
        let name = item.stringName.substring(item.stringName.indexOf('.') + 1);
        Model.disableRemoteMethodByName(name);
      }
    })
  }

  let relations = options.disable.relations || {};
  Object.keys(relations).forEach(key => {
    let modes = relations[key];
    let disableModes = Array.isArray(modes) ? modes : [modes];

    disableModes.forEach(p => {
      let disableMode = Model.disableMode[p];

      if (disableMode) {
        disableMode(key);
      }
    })
  })

};

