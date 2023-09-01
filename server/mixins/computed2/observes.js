'use strict';

const url = require('url');
const Promise = require('bluebird');

module.exports = function(Model, options = {}) {

  // The loaded observer is triggered when an item is loaded
  Model.observe('loaded', function(ctx, next) {
    Model.seedProperties1(ctx.instance || ctx.data);

    next();
  });

  Model.observe('before save', function(ctx, next) {
    let instance = ctx.instance || ctx.currentInstance;
    let isNewInstance = ctx.isNewInstance === true;

    if (isNewInstance) {
      Model.undefinedProperties(instance, options.properties);
    }

    next();
  });

  Model.observe('after save', function(ctx, next) {
    let instance = ctx.instance || ctx.currentInstance;
    let isNewInstance = ctx.isNewInstance === true;

    if (isNewInstance) {
      Model.seedProperties1(instance);
    }

    next();
  });

};