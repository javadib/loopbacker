'use strict';

const DS_NAME = 'hamsora';
const DS_CONNECTOR = 'mssql';
const BASE_MODEL_NAME = 'BaseModel';
const DEFAULT_BASE_MODEL_NAME = 'PersistedModel';
const EXCLUDE_LIST = ['sysdiagrams', '__MigrationHistory'];
const SCHEMA_SEPARATOR = '_';
const ADD_BASE_MODEL_TO_MODEL_CONFIG = true;
const EXECUTE_DISCOVERY = true;

if (!EXECUTE_DISCOVERY) return;

const fs = require("fs");
const path = require("path");
const async = require("async");
const modelPath = path.resolve(__dirname, '../../common/models');
const modelConfigFileName = path.resolve(__dirname, '../model-config.json');

module.exports = function(app) {
  var dataSource = app.datasources[DS_NAME];
  dataSource.discoverSchemasOrginal = dataSource.discoverSchemas;

  function queryForeignKeys(owner, table) {
    var sql =
        'SELECT KCU1.CONSTRAINT_NAME AS FK_CONSTRAINT_NAME' +
        ' ,KCU1.table_schema AS FK_TABLE_SCHEMA' +
        ' ,KCU1.TABLE_NAME AS FK_TABLE_NAME' +
        ' ,KCU1.COLUMN_NAME AS FK_COLUMN_NAME' +
        ' ,KCU1.ORDINAL_POSITION AS FK_ORDINAL_POSITION' +
        ' ,KCU2.table_schema AS REFERENCED_TABLE_SCHEMA' +
        ' ,KCU2.CONSTRAINT_NAME AS REFERENCED_CONSTRAINT_NAME' +
        ' ,KCU2.TABLE_NAME AS REFERENCED_TABLE_NAME' +
        ' ,KCU2.COLUMN_NAME AS REFERENCED_COLUMN_NAME' +
        ' ,KCU2.ORDINAL_POSITION AS REFERENCED_ORDINAL_POSITION' +
        ' FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC' +

        ' INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU1' +
        ' ON KCU1.CONSTRAINT_CATALOG = RC.CONSTRAINT_CATALOG' +
        ' AND KCU1.CONSTRAINT_SCHEMA = RC.CONSTRAINT_SCHEMA' +
        ' AND KCU1.CONSTRAINT_NAME = RC.CONSTRAINT_NAME' +

        ' INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU2' +
        ' ON KCU2.CONSTRAINT_CATALOG = RC.UNIQUE_CONSTRAINT_CATALOG' +
        ' AND KCU2.CONSTRAINT_SCHEMA = RC.UNIQUE_CONSTRAINT_SCHEMA' +
        ' AND KCU2.CONSTRAINT_NAME = RC.UNIQUE_CONSTRAINT_NAME' +
        ' AND KCU2.ORDINAL_POSITION = KCU1.ORDINAL_POSITION';

    if (owner) {
      sql += ' AND KCU2.table_schema=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND KCU1.table_name=\'' + table + '\'';
    }

    return sql;
  }


  dataSource.discoverForeignKeys = function(table, options, cb) {
    var sql = queryForeignKeys(options.owner, table);

    dataSource.connector.execute(sql, function (err, fks) {
      if (err) return cb(err);

      var result  = fks.map(fk => {
        var pkTableNameWithSchema = `${fk.REFERENCED_TABLE_SCHEMA}${SCHEMA_SEPARATOR}${fk.REFERENCED_TABLE_NAME}`;
        var fkTableNameWithSchema = `${fk.FK_TABLE_SCHEMA}${SCHEMA_SEPARATOR}${fk.FK_TABLE_NAME}`;

        var item = {
          fkOwner:	fk.FK_TABLE_SCHEMA,	//Foreign key table schema (may be null)
          fkName:	pkTableNameWithSchema.toCamelCase(), // Foreign key name (may be null)
          fkNameOrigin:	fk.FK_CONSTRAINT_NAME, //	Foreign key name (may be null)
          fkTableName:	fk.FK_TABLE_NAME, //	Foreign key table name
          fkTableNameWithSchema:	fkTableNameWithSchema,
          fkColumnName:	fk.FK_COLUMN_NAME	, //Foreign key column name
          keySeq:	fk.FK_ORDINAL_POSITION	, //Sequence number within a foreign key( a value of 1 represents the first column of the foreign key, a value of 2 would represent the second column within the foreign key).
          pkOwner:	fk.REFERENCED_TABLE_SCHEMA	, //Primary key table schema being imported (may be null)
          pkName:	fk.REFERENCED_CONSTRAINT_NAME	, //Primary key name (may be null)
          pkTableName:	fk.REFERENCED_TABLE_NAME	, //Primary key table name being imported
          pkTableNameWithSchema:	pkTableNameWithSchema,
          pkColumnName:	fk.REFERENCED_COLUMN_NAME	, //Primary key column name being imported
        };

        return item;
      });

      cb(null, result);
    })
  };

  dataSource.discoverSchemas = function(tableName, options, cb) {
    dataSource.discoverSchemasOrginal(tableName, options, function (err, schemas) {
      if (err) return cb(err);

      var result = [];
      Object.keys(schemas).forEach(key => {
        var model = reFormatModel(schemas[key], key, {baseModel: BASE_MODEL_NAME});
        result.push(model);
      });

      cb(null, result);
    });
  };


  String.prototype.toCamelCase = function () {
    var value = this;
    var s = value.substring(0, 1);

    return value.replace(s, s.toLowerCase());
  };

  String.prototype.toPascalCase = function () {
    var value = this;
    var s = value.substring(0, 1);

    return value.replace(s, s.toUpperCase());
  };

  function nameMapper(type, name){
    var lowerCaseList = ['id', 'ip', 'io'];

    switch (type) {
      case 'column':
        if (lowerCaseList.includes(name.toLowerCase())) {
          return name.toLowerCase();
        }

        return name.toCamelCase();
      default:
        return name;
    }
  }

  function addBaseModel(newModels) {
    var baseModel = {};
    baseModel[BASE_MODEL_NAME] = {
      "dataSource": DS_NAME,
      "public": false,
      "$promise": {},
      "$resolved": true
    };

    newModels.push(baseModel);
  }

  function setModelName(schema, schemaRootKey) {
    return schemaRootKey.replace('.', SCHEMA_SEPARATOR);
  }

  function setJsonFileName(model) {
    var replace = model.name.replace('_', '-');

    return `${modelPath}/${replace}.json`;
  }

  function setJsFileName(model) {
    var replace = model.name.replace('_', '-');

    return `${modelPath}/${replace}.js`;
  }


  function reFormatModel(schema, rootKey, options) {
    options = options || options;
    var model = schema;

    var newModel = {
      "name": setModelName(schema, rootKey),
      "base": options.baseModel || DEFAULT_BASE_MODEL_NAME,
      "strict": options.strict || true,
      "idInjection": options.idInjection || false,
      "options": {
        "validateUpsert": options.validateUpsert || true
      }
    };

    newModel[DS_CONNECTOR] = model.options[DS_CONNECTOR];
    newModel.mixins = {};
    newModel.hidden = [];
    newModel.properties = model.properties;
    newModel.validations = [];

    // newModel.relations = model.options.relations || {};
    newModel.relations = {};
    var keys = Object.keys(model.options.relations);
    keys.forEach(key => {
      newModel.relations[key] = {
        type: 'belongsTo',
        model: key.toPascalCase(),
        foreignKey: model.options.relations[key].foreignKey,
      }
    });


    newModel.acls = [];
    newModel.methods = {};

    return newModel;
  }

  function createModel(model, options) {
    var jsonFileName = setJsonFileName(model);
    var callback = err => console.log(err || `Model ${model.name} was created successfully`);

    var data = JSON.stringify(model, null, 2);
    fs.writeFile(jsonFileName, data, callback);

    if (options.createJsFile === true) {
      var jsFileName = setJsFileName(model);
      var jsContent = `'use strict';\n\nmodule.exports = function(${model.name}) {\n\n};`;

      fs.writeFile(jsFileName, jsContent, callback);
    }

    return {
      key: model.name, value: {
        "dataSource": DS_NAME,
        "public": options.publicModel || true,
        "$promise": {},
        "$resolved": true
      }
    };
  }


  function addToModelConfig(newModels) {
    fs.readFile(modelConfigFileName, {}, function (err, data) {
      if (err) return console.log(err);

      var callback = err => console.log(err || `model-config successfully updated`);
      var modelConfig = JSON.parse(data);
      newModels.forEach(newModel => {
        modelConfig[newModel.key] = newModel.value;
      });


      var newModelConfig = JSON.stringify(modelConfig, null, 2);
      fs.writeFile(modelConfigFileName, newModelConfig, callback)
    })
  }

  dataSource.discoverModelDefinitions({all :true}, function (err, models) {
    if (err) return console.log(models);

    var newModels = [];
    if (ADD_BASE_MODEL_TO_MODEL_CONFIG === true) {
      addBaseModel(newModels);
    }

    var fns = [];
    models.filter(p => !EXCLUDE_LIST.includes(p.name)).forEach(model => {
      fns.push(function (cb) {
            var options = {
              owner: model.owner || model.schema,
              relations: true,
              associations: true,
              nameMapper: nameMapper
            };

            dataSource.discoverSchemas(model.name, options,
                function (err, schemas) {
                  if (err) return console.log(err);

                  Object.keys(schemas).forEach(key => {
                    // var model = reFormatModel(schemas[key], key, {baseModel: BASE_MODEL_NAME});
                    // var addedModel = createModel(model, {createJsFile: true});
                    var addedModel = createModel(schemas[key], {createJsFile: true});

                    newModels.push(addedModel);
                  });

                  cb(null, true);
                })

          }//end of cb
      );
    });

    async.parallel(fns, function (err, result) {
      if (err) return console.log(err);

      addToModelConfig(newModels);
    });

  })
};
