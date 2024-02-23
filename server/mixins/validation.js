'use strict';

module.exports = function (Model, options) {
  let properties = Model.definition.properties;

  let addPatternValidation = function (key, pattern) {
    pattern.message = pattern.message || "invalid format. Use valid {0}.";
    pattern.message = pattern.message.replace(/\{0\}/g, key);

    Model.validatesFormatOf(key, pattern);
  };

  function addInclusionValidation(key, enumExp) {
    enumExp.in = enumExp.in || enumExp;
    enumExp.message = enumExp.message || `${key} is not allowed.`;

    Model.validatesInclusionOf(key, enumExp);
  }

  function addUniquenessValidation(key, indexObj) {
    let message = `${key} already exist.`;
    Model.validatesUniquenessOf(key, {message: indexObj.message || message});
  }

  // EntryPoint
  Object.keys(properties).forEach(key => {
    let prop = properties[key];

    if (prop.hasOwnProperty("pattern")) {
      addPatternValidation(key, prop["pattern"]);
    }

    //TODO: Fix me
    // if (prop.hasOwnProperty("enum")) {
    //   addInclusionValidation(key, prop["enum"]);
    // }

    let indexObject = prop["index"];
    if (indexObject && indexObject.unique === true) {
      addUniquenessValidation(key, indexObject);
    }
  });


};
