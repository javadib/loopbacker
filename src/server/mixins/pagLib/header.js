"use strict";

module.exports = function (Model, options) {

  const mapItem = display => {
    let {mapping = {}} = options.header;

    return {
      [mapping.id || 'id']: display.id,
      [mapping.name || 'name']: display.name,
      [mapping.order || 'order']: display.order,
      [mapping.prompt || 'prompt']: display.prompt,
      [mapping.readonly || 'readonly']: display.readonly,
      [mapping.shortName || 'shortName']: display.shortName,
      [mapping.groupName || 'groupName']: display.groupName,
      [mapping.description || 'description']: display.description,
      // [mapping.autoGenerateField || 'autoGenerateField']: display.autoGenerateField,
      [mapping.autoGenerateFilter || 'autoGenerateFilter']: display.autoGenerateFilter,
    }
  };

  Model.makeHeaders = function(DataModel, options, filter) {
    let {mapping = {}} = options.header || {};
    let {excludeList = []} = options.header;
    let properties = DataModel.definition.properties;
    let hidden = options.header.excludeHidden === true ?
      DataModel.definition.settings.hidden || [] : [];

    let filters = prop => {
      let key = 'autoGenerateField';
      let hasFilter = prop.display && prop.display.hasOwnProperty(key);

      return hasFilter ? prop.display[key] : true;
    };

    filter.fields = filter.fields || [];
    const fieldsFilter = key => filter.fields.length > 0 ? filter.fields.indexOf(key) >= 0 : true;

    let headers = {};
    Object.keys(properties)
      .filter(key => filters(properties[key]))
      .filter(key => hidden.indexOf(key) < 0)
      .filter(key => excludeList.indexOf(key) < 0)
      .filter(key => fieldsFilter(key))
      .forEach(key => {
        let property = properties[key];
        let header;
        let display = property.display || {};

        header = mapItem(display);
        let typeName = Array.isArray(property.type) ?
          'Array' : property.type.name;
        header.type = typeName.toLowerCase();

        headers[key] = header;
      });

    return headers;
  };
};

