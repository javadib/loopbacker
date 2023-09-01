'use strict';

const url = require('url');
const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('loopback-ds-computed-mixin');

module.exports = function(Model, options = {}) {
  let logger = options.logger || true;

  // Logger
  const L = msg => {
    if (logger) {
      debug(msg);
    }
  };

  Model.computeLocalNumber = function(instance, sourceProp) {
    return Number(instance[sourceProp]).toLocaleString();
  };

  Model.undefinedProperties = function(instance, props) {
    if (!instance) {
      return L('instance is undefined or null.');
    }

    Object.keys(props).forEach(key => instance[key] = undefined);
  };

  Model.seedProperties1 = function(instance) {
    Object.keys(options.properties).forEach(function(property) {
      let prop = options.properties[property];
      let callback = prop.method || prop;

      if (typeof Model[callback] !== 'function') {
        L('Function %s not found on Model', callback);
        return false;
      }

      L('Computing property %s with callback %s', property, callback);

      let value = Model[callback](instance);
      if (value.then === undefined) {
        instance[property] = value;
        // instance.__data[property] = value;
      } else {
        return Model[callback](instance)
          .then(function(res) {
            instance[property] = res;
            // instance.__data[property] = value;
          })
          .catch(err => L(err.message));
      }
    });
  };
};