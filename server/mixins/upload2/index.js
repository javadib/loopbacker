'use strict';

module.exports = function(Model, Options = {}) {
  require('./methods')(Model, Options);
  require('./observes')(Model, Options);
  require('./events')(Model, Options);

};

