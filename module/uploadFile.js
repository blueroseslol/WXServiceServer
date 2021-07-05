const multer = require('multer');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');

exports.upload = multer({
    storage: multer.diskStorage({
        destination: process.cwd() + '/public/uploads',
        filename: (req, file, cb) => {
            cb(null, file.fieldname+"-"+Date.now()+"-"+md5.update(file).digest('hex'));
        }
    })
    //其他设置请参考multer的limits
    //limits:{}
});


