'use strict';

const _ = require('lodash');

module.exports = function (Model, Options) {
  let logger = Options.logger || true;
  let mixOptions = Options.options || {defaultGroupName: 'main'};

  const L = msg => {
    if (logger) {
      console.log(msg);
    }
  };

  let properties = Model.definition.properties;
  let propKeys = Options.properties === "*" ?
      Object.keys(properties) : Options.properties || [];

  if (!propKeys) {
    L(`No properties found in metadata!`);
    return;
  }

  propKeys.forEach(key => {
    let obj = properties[key];

    if (obj.display) {
      let id = obj.display.id || `model.${Model.modelName.toLowerCase()}.${key}`;
      obj.display.id = id;

      let name = obj.display.name || key;
      obj.display.name = _.startCase(name);

      let description = obj.display.description || name || key;
      obj.display.description = _.startCase(description);

      let placeholder = obj.display.placeholder || name || key;
      obj.display.placeholder = _.startCase(placeholder);

      let groupName = obj.display.groupName || mixOptions.defaultGroupName;
      obj.display.groupName = groupName;

      let order = obj.display.order || 0;
      obj.display.order = order;

      let prompt = obj.display.prompt || null;
      obj.display.prompt = prompt;

      let readonly = obj.display.readonly || false;
      obj.display.readonly = readonly;

      let shortName = obj.display.shortName || name || key;
      obj.display.shortName = _.startCase(shortName);
    }
  })
};
