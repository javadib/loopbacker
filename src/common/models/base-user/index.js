"use strict";

module.exports = (BaseUser) => {
  require('./methods')(BaseUser);
  require('./observes')(BaseUser);
  require('./controllers')(BaseUser);
};