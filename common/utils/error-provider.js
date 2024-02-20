'use strict';

const util = require('util');

const error = new Error();

exports.buildError = exports.buildError = buildError;
function buildError(message, options, appended) {
  error.statusCode = (options && options.statusCode) || 422;
  error.status = (options && options.status) || 422;
  error.code = (options && options.code) || 'VALIDATION_ERROR';
  error.message = (options && options.message) || 'Validation error.';

  error.message = appended ? util.format('%s %s', error.message, message) : message || error.message;

  return error;
}

exports.authorizeRequired = exports.authorizeRequired = authorizeRequired;
function authorizeRequired(message, appended) {
  const option = {};
  option.statusCode = 401;
  option.status = 401;
  option.code = 'AUTHORIZATION_REQUIRED';
  option.message = 'Authorization Required.';

  return buildError(message, option, appended);
}

exports.notFound = exports.notFound = notFound;
function notFound(message, appended) {
  const option = {};
  option.statusCode = 404;
  option.status = 404;
  option.code = 'NOT_FOUND';
  option.message = 'Model not found.';

  return buildError(message, option, appended);
}

exports.validateError = exports.validateError = validateError;
function validateError(message, appended, options) {
  return buildError(message, options, appended);
}

//------------------------------------ new ver -----------------------------------

const err = {};

err.makeError = function(message, options) {
  options = options || {};
  error.localized = options.localized || true;
  error.statusCode = options.statusCode || 422;
  error.status = options.status || 422;
  error.code = options.code || 'VALIDATION_ERROR';
  error.message = options.message || 'خطای اعتبارسنجی';

  error.message = options.appendMessage ? util.format('%s %s', error.message, message) : message || error.message;

  return error;
};

err.validateError = function(message, options) {
  return err.makeError(message, options);
};

err.authorizeRequire = function authorizeRequired(message, appended) {
  const option = {};
  option.statusCode = 401;
  option.status = 401;
  option.code = 'AUTHORIZATION_REQUIRED';
  option.message = err.codes.AUTHORIZATION_REQUIRED;
  option.appendMessage = appended;

  return err.makeError(message, option);
};

err.notFound = function(message, appended) {
  const option = {};
  option.statusCode = 404;
  option.status = 404;
  option.code = 'NOT_FOUND';
  option.message = 'چیزی یافت نشد.';
  option.appendMessage = appended;

  return err.makeError(message, option);
};

err.getMessage = function (displayName, code) {
  code = code.toUpperCase();
  let msg = err.codes[code];

  if (msg) return msg;

  switch(code) {
    case "PRESENCE":
      return err.codes.OBJECT_REQUIRED;
    case "UNIQUENESS":
      return err.codes.OBJECT_ALREADY_EXIST;
    case "AUTHORIZATION_REQUIRED":
      return err.codes.AUTHORIZATION_REQUIRED;
    case "PERMISSION_DENIED":
      return err.codes.AUTHORIZATION_REQUIRED;
    case "OBJECT_NOT_FOUND":
      return err.codes.OBJECT_NOT_FOUND;
    case "INTERNAL_SERVER_ERROR":
      return err.codes.INTERNAL_SERVER_ERROR;
  }
};

err.setErrorCode = function(statusCode) {
  switch(statusCode) {
    case 401:
      return "AUTHORIZATION_REQUIRED";
    case 403:
      return "PERMISSION_DENIED";
    case 404:
      return "OBJECT_NOT_FOUND";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    case 11000:
      return "UNIQUE_INDEX_ERROR";
  }
};


err.localMessage = function (displayName, code) {
  console.log(`err.localMessage. code is: ${code}`);

  let msg = err.codes[code] || err.codes.UNKNOWN_ERROR;

  console.log(`err.localMessage. message is: ${msg}`);


  return msg.indexOf('%s') > -1 ?  util.format(msg, displayName) : msg;
};

err.localMessages = function (app, details, options) {
  options = options || {};
  options.skipUndefinedCode = options.skipUndefinedCode || true;
  const Model = app.models[details.context];

  const messages = {};
  Object.keys(details.codes).forEach(propName => {
    let property = Model.definition.properties[propName];
    const displayName = property.displayName || propName;

    let codes = details.codes[propName];
    let msg = Array.isArray(codes) ?
        codes.map(code => {
          let msg = err.getMessage(displayName, code);

          if (options.skipUndefinedCode === true && !msg) return;

          return msg.indexOf("%s") > -1 ? util.format(msg, displayName) : msg;
        }).filter(p => p) :
        err.localMessage(displayName, codes);

    messages[propName] = Array.isArray(msg) ? msg.join('\n') : msg;
  });

  return messages;
};

err.codes = {
  "UNKNOWN_ERROR": 'خطای ناشناخته در سامانه رخ داده است.',
  "AUTHORIZATION_REQUIRED": "دسترسی شما برای دیدن این بخش مجاز نیست.",
  "MODEL_NOT_FOUND": "موردی یافت نشد.",
  "UNIQUE_INDEX_ERROR": "شماره موبایل تکراری است.",
  "RATE_EXCEED": "مقدار درصد باید بین ۰ و ۱۰ باشد.",
  "INTERNAL_SERVER_ERROR": "خطای داخلی در سرور رخ داده است. لطفا دقایقی دیگر امتحان کنید.",
  "ORDER_ALREADY_ASSIGNED": 'سفارش قبلا ب کارشناس دیگری اختصاص داده شده است.',
  "TICKET_ALREADY_ASSIGNED": 'تیکت قبلا ب کارشناس دیگری اختصاص داده شده است.',
  "ORDER_ALREADY_CANCELED": 'سفارش قبلا لغو شده است.',
  "ORDER_ALREADY_SHOPPED": 'سفارش قبلا انجام شده و به پایان رسیده است.',
  "TICKET_ALREADY_CANCELED": 'تیکت قبلا بسته شده است.',
  "OBJECT_EXPIRE": '%s منقضی شده است.',
  "OBJECT_EXCEED_USAGE": 'تعداد دفعات استفاده از %s بیش از حد مجاز است.',
  "OBJECT_NTO_ACTIVATED": '%s قعال نیست.',
  "COUPON_AT_LEAST_MIN_PAY_PRICE": 'حداقل مبلغ خرید برای استقاده از این تخفیف %f تومان است.',
  "OBJECT_NOT_FOUND": '%s یافت نشد.',
  "MOBILE_NOT_VERIFIED": 'شماره موبایل شما تایید نشده است. لطفا ابتدا آن را تایید کنید.',
  "ACCOUNT_DEACTIVATE": 'حساب شما موقتا غیرفعال شده است. لطفا با تیم پشتیبان تماس حاصل نمایید.',
  "VALUE_LESS_THAN": '%s نمی تواند کوچکتر از %s باشد.',
  'VALUE_GREAT_THAN': '%s نمی تواند بزرگتر از %s باشد.',
  "ROLE_NAME_IS_NOT_DEFINED": 'همجین نام نقشی وحود ندارد.',
  "USER_NOT_ACTIVATED": 'دسترسی شما به سامانه فعال نیست. لطفا با مدیری سامانه تماس حاصل نمایید.',
  "LOGIN_FAILED": "عملیات ورود ناموفق است.",
  "OBJECT_REQUIRED": "%s ضروری است.",
  "OBJECT_IS_INCORRECT": "%s صحیح نیست.",
  "OBJECT_MUST_BETWEEN": "%s باید بین %s و %s باشد.",
  "OBJECT_ALREADY_EXIST": "%s از قبل وجود دارد.",
  "USER_NOT_FOUND": "'کاربری با این شماره یافت نشد.'",
};

module.exports = err;
