'use strict';

const url = require('url');

module.exports = function(Model, Options = {}) {
  let logger = Options.logger || true;
  let {mapper = {}} = Options;
  let {filter = {}} = Options;
  let props = Model.definition.properties;
  let settings = Model.definition.settings;

  // Const key
  let ORDER = 'order';
  let PARAMS = 'params';
  let READONLY = 'readonly';
  let ENDPOINT = 'endpoint';

  // All options
  let crudOptions = [
    {key: 'c', value: Options.c},
    {key: 'r', value: Options.r},
    {key: 'u', value: Options.u},
    {key: 'd', value: Options.d},
  ];

  Model.httpModelName = function() {
    return Model.http.path.substring(1)
  };

  // Logger
  const L = msg => {
    if (logger) {
      console.log(msg);
    }
  };

  const getBaseUrl = function() {
    return Options.baseUrl ||
      Model.app.settings[Options.appSettingsKey] ||
      Model.app.settings.url;
  };

  const getType = function(prop) {
    return Array.isArray(prop.type) ?
      `[${typeof prop.type[0]()}]` :
      typeof prop.type()
  };

  const mapItem = (prop, display) => {
    let {mapping = {}} = Options.header || {};

    return {
      [mapping.name || 'name']: display.name,
      [mapping.required || 'required']: prop.required,
      [mapping.type || 'type']: getType(prop),
      [mapping.order || 'order']: display.order,
      [mapping.prompt || 'prompt']: display.prompt,
      [mapping.readonly || 'readonly']: display.readonly,
      [mapping.shortName || 'shortName']: display.shortName,
      [mapping.groupName || 'groupName']: display.groupName,
      [mapping.description || 'description']: display.description,
      [mapping.autoGenerateField || 'autoGenerateField']: display.autoGenerateField,
      [mapping.autoGenerateFilter || 'autoGenerateFilter']: display.autoGenerateFilter,
    };
  };

  function makeCrudStatus(prop, op, Options) {
    let crud = prop.crud;
    let defaultOp = Options[op].default;
    let crudOp = crud && crud[op];

    let b =
      crudOp === false ||
      crudOp === null ||
      crud && crud.hasOwnProperty(op);

    if (b && !crudOp) {
      return null;
    }

    let result = crudOp ? crudOp :
      crud === true || crud === '*' || defaultOp ? {} : undefined;

    return result;
  }

  Model.buildOperation = function(prop, op) {
    let opValue = makeCrudStatus(prop, op, Options);
    let display = prop.display || {};

    if (!opValue) return;

    if (opValue.hasOwnProperty(READONLY)) {
      display[READONLY] = opValue[READONLY];
    }

    if (opValue.hasOwnProperty(ORDER)) {
      display[ORDER] = opValue[ORDER];
    }

    return mapItem(prop, display);
  };

  function fixEndpointUrl(endpoint, param) {
    let id = param.id || param.pk;

    if (endpoint) {
      let fixedUrl = endpoint.url.replace(/{id}/g, id);
      endpoint.url =  fixedUrl; //url.resolve(getBaseUrl(), fixedUrl);
    }

    return endpoint;
  }

  Model.crud = function(param, cb) {
    let result = {
      c: {model: {}},
      u: {model: {}},
      d: {},
      [PARAMS]: {},
    };

    Object.keys(props)
      .filter(p => filter.skipNullDisplay ? props[p].display : true)
      .forEach(key => {
      let prop = props[key];
      result.c.model[key] = Model.buildOperation(prop, 'c');
      result.u.model[key] = Model.buildOperation(prop, 'u');
    });

    crudOptions
      .filter(p => p.value)
      .forEach(op => {
        let opValue = JSON.parse(JSON.stringify(op.value)); // Deep clone

        fixEndpointUrl(opValue[ENDPOINT], param);

        Object.assign(result[PARAMS], param);

        Object.assign(result[op.key], opValue);
      });

    return cb && cb(null, result);
  };

  Model.remoteMethod(
    'crud', {
      isStatic: true,
      description: 'Get CRUD operations of model.',
      http: {'path': '/crud', verb: 'post'},
      accepts: [
        {arg: 'param', type: 'object', required: false, http: {source: 'body'}},
      ],
      returns: {
        arg: 'result',
        type: Model,
        root: true,
        description: 'CRUD model operations.',
      },
    },
  );

};