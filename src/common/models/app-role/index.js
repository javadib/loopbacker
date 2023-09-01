"use strict";

module.exports = (AppRole) => {

  require('./observes')(AppRole);
  require('./methods')(AppRole);
  require('./controllers')(AppRole);

  require('./seed')(AppRole);

};