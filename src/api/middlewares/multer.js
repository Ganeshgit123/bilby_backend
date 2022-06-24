const multer = require('multer')

var storage = multer.memoryStorage({
    destination: function (req, file, callback) {
      callback(null, '')
    }
  })


exports.upload = multer({ storage })