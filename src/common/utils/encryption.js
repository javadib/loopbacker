const crypto = require('crypto');
var encrytpt = {};
var algorithm = 'aes-256-ctr', password = '9489235023-590=e=2-923=-fsdkljfwefasdfLKJR23950UEFJWLKUR0d6F3Efeq';

encrytpt.encrypt = function (text) {
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

encrytpt.decrypt = function(text) {
  var decipher = crypto.createDecipher(algorithm, password);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}


module.exports = encrytpt;
