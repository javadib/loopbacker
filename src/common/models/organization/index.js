"use strict";

module.exports = (Organization) => {

  require('./observes')(Organization);
  require('./methods')(Organization);
  require('./controllers')(Organization);

};