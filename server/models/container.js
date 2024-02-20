var crypto = require("crypto");

module.exports = function(Container) {
  // Container.disableRemoteMethod('createContainer', true);
  // Container.disableRemoteMethod('destroyContainer', true);
  // Container.disableRemoteMethod('removeFile', true);
  // Container.disableRemoteMethod('upload', true);

  Container.hash = function (containerId, filename, cb) {

    var fileInfo = {
      container: containerId, filename: filename
    };

    var downloadedFileStream;

    // Initializing crypto ReadStream using Loopback Storage Component API
    downloadedFileStream = Container.downloadStream(containerId, filename, function (err) {
      console.log(err);
      cb(err, null);
    });

    // Initializing crypto writeStream, using crypto module from node
    var hash = crypto.createHash('sha256');
    hash.setEncoding('hex');

    // When the Stream ends, send back the hashcode
    downloadedFileStream.on('end' , function () {
      hash.end();
      fileInfo.sha256 = hash.read();
      cb(null, fileInfo);
    });

    // Piping readStream to the WriteStream
    downloadedFileStream.pipe(hash);

  };

  Container.remoteMethod('hash', {
    accepts: [{arg: 'container', type: 'string', required: true}, {arg: 'filename', type: 'string', required: true}],
    returns: {arg: 'result', type: 'string'},
    http: {path: '/:container/hash/:filename', verb: 'get'}
  });
};
