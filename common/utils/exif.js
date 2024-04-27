"use strict";

const fs = require('fs');
const fsProm = fs.promises;
const exif = require('exiftool');

const handler =  {};

function parseInternal(stream, cb) {
  return new Promise((resolve, reject) => {
    exif.metadata(stream, ["-n"], function (err, metadata) {
      cb && cb(err, metadata);

      return err ? reject(err) : resolve(metadata);
    })
  })
}


handler.parse = function (filename, cb) {
  return fsProm.readFile(filename)
    .then(data => parseInternal(data, cb))
    .catch(err => {cb && cb(err); return Promise.reject(err)})
};


handler.parseStream = function (stream, cb) {
  return parseInternal(stream, cb);
};


module.exports = handler;
