"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const async = require('async');
const error = require("./error-provider");
const exif = require("./exif");


exports.hashFileName = function (file) {
  const fileSHA256 = crypto.createHash('md5').update(file.buffer).digest("hex");
  let hashFile = fileSHA256 + path.extname(file.originalname);

  return hashFile;
};

exports.hashFile = function (basePath, fileObject) {
  const fileSHA256 = crypto.createHash('md5').update(fileObject.buffer).digest("hex");
  let newPath = path.join(basePath, fileSHA256 + path.extname(fileObject.originalname));

  return newPath;
};


function renameFile(fileInfo, basePath, renameTo) {
  switch (renameTo) {
    case undefined:
      return path.join(basePath, fileInfo.originalname);
    case null:
      return path.join(basePath, fileInfo.originalFilename);
    case "":
      return path.join(basePath, fileInfo.originalFilename);
    case "@hash":
      return exports.hashFile(basePath, fileInfo);
  }
}

exports.saveFile = function (basePath, fileObject, options, cb) {
  if (!fileObject) {
    return cb(error.validateError('هیج فایلی برای اپلود انتخاب نشده است.'));
  }

  options = options || {};
  options.createPathIfNotExist = options.createPathIfNotExist || true;
  const relativePath = options.relativePath || basePath;

  if (options.createPathIfNotExist === true && !fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
  }

  const newPath = renameFile(fileObject, basePath, options.renameTo);
  const fileName = path.basename(newPath);

  fs.writeFile(newPath, fileObject.buffer, function (err) {
    const relativeFileName = path.join(relativePath, fileName);
    let data = {
      key: fileObject.fieldname,
      fileName: newPath,
      relativeFileName: relativeFileName,
      additionalData: options.additionalData || undefined
    };

    exif.parseStream(fileObject.buffer).then(exData => {
      data.exifData = exData;
      return err ? cb && cb(err) : cb && cb(null, data);
    }).catch(exErr => err ? cb && cb(err) : cb && cb(err));

  });
};

exports.saveFiles = function (req, storage, options = {}, cb) {
  const files = req.files || [];
  const tasks = [];

  files.forEach(file => {
    let key = file.id;
    tasks.push(function (callback) {
      let opt = {
        createPathIfNotExist: true,
        relativePath: storage.settings.relativeRoot,
        renameTo: options.renameTo,

        additionalData: {
          name: file.fieldname,
          fileName: file.originalname
        }
      };

      opt.additionalData = Object.assign(opt.additionalData, file);

      exports.saveFile(storage.settings.root, file, opt, callback);
    })
  });


  return async.parallel(tasks, cb);
};


module.exports = exports;
