'use strict';

module.exports = function (Model, Options) {
  let {remote = true} = Options.methods;

  require('./magic-search/methods')(Model, Options);
  // require('./magic-search/relation')(Model, Options);
  // require('./magic-search/scopes')(Model, Options);


  Object.keys(Options.methods).forEach(key => {
    let method = Options.methods[key];
    let httpPath = method.path || key;

    let filter = {where: {or: []}};
    Model.buildSearch(key, method, filter);

  })

};
