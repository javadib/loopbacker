"use strict";

module.exports = function(Credential) {

  Credential.setter.email = function(value) {
    this.$email = value;
    const resolveGmailAccount = Credential.settings.resolveGmailAccount;

    if (resolveGmailAccount && this.$email) {
      const gmailCom = 'gmail.com';
      const emailObject = this.$email.split('@');
      let isValidGmail = emailObject && emailObject.length === 2
          && emailObject[1].toLowerCase() === gmailCom;

      if (isValidGmail) {
        this.$email = [emailObject[0].replace(/\./g, ''), '@', emailObject[1]].join('');

        console.log('resolveGmailAccount changed: ', this.$email);
      }
    }
  };

};
