'use strict';

var error = require("../common/utils/error-provider.js");

module.exports = function(SentMessage) {
  SentMessage.disableRemoteMethodByName('deleteById');
};
