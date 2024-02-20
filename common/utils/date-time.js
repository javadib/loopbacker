"use strict";

const moment = require('moment');


exports.toJalaali = function (date, format, locale = "fa") {
  format = format || 'YYYYMMDD';
  let mmnt = moment(date, format);

  if (!mmnt.isValid()) return undefined;

  moment.locale(locale);

  return mmnt.fromNow();
};

module.exports = exports;
