'use strict';

module.exports = function (Model, Options) {
  let {remote = true} = Options.methods;

  require('./magic-search/methods')(Model, Options);
  require('./magic-search/relation')(Model, Options);
  require('./magic-search/scopes')(Model, Options);

  Model.buildOrClause = function (method, keyword) {
    let orString = JSON.stringify(method.or);
    let orClause = orString.replace(/{keyword}/g, keyword);
    let or = JSON.parse(orClause);

    return Object.keys(or).map(key => {return {[key]: or[key]}});
  };


  Object.keys(Options.methods).forEach(key => {
    let method = Options.methods[key];
    let httpPath = method.path || key;


    let filter = {where: {or: []}};
    Model.buildSearch(key, method, filter, httpPath);

  })

};
