'use strict';

const computed = require('./computed2');

module.exports = function mixin(app, ops) {
  // app.modelBuilder.mixins.define('Computed2', computed);

  require('./computed2/')(app, ops);
};
