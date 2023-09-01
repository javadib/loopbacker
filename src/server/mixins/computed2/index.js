'use strict';

const url = require('url');
const debug = require('debug')('loopback-ds-computed-mixin');
const _ = require('lodash');

module.exports = function(Model, Options = {}) {
  require('./methods')(Model, Options);
  require('./observes')(Model, Options);

  let props = Options.properties;
  // Trigger a warning and remove the property from the watchlist when one of
  // the property is not found on the model or the defined callback is not found
  _.mapKeys(Options.properties, function(callback, property) {
    if (_.isUndefined(Model.definition.properties[property])) {
      debug('Property %s on %s is undefined', property, Model.modelName);
    }

    if (typeof Model[callback] !== 'function') {
      debug('Callback %s for %s is not a model function', callback, property);
    }
  });

  debug('Computed mixin for Model %s with options %o', Model.modelName, Options);
};