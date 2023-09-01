'use strict';

module.exports = function (Model, Options) {
  const L = (msg) => console.log(msg);

  Model.prototype.getModelFromKey = function (keyword) {
    let option = Options[keyword];

    return option && option.modelName;
  };

  Model.prototype.uniqueErrorMessage = function (keyword) {
    let keyName = Options[keyword].keyName || 'مقدار';
    let msg = `${keyName} وارده شده از قبل ثبت شده است. یک مقدار دیگر وارد کنید .`;

    return msg;
  };
};
