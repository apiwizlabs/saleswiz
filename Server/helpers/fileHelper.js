const multer = require("multer");
var fs = require("fs");
const path = require('path');

var dir = "./public/images";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}


const fileStorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, dir)
  },
  filename: function (req, file, cb) {
          cb(null, Date.now() + "-" + file.originalname)
  }
});

const upload = multer({ 
  storage: fileStorageEngine,   
  limits: { fileSize: 10 * 1024 * 1024 },
});
    
// module.exports = upload;
module.exports = {upload};