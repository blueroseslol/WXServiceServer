var express = require('express');
var crypto = require('crypto');
var router = express.Router();

//全局变量
var Token = "SendToken";
var appID = "wxbeb8b51a3d075db0";
var appsecret = "c956e0308d1d096d1c82706eb96b1de0";


function checkSignature(query) {
    let signature = query.signature;
    let timestamp = query.timestamp;
    let nonce = query.nonce;

    //WX平台上设置的Token

    let tmpArr = [Token, timestamp, nonce];
    let tempStr = tmpArr.sort().join('');
    let result = crypto.createHash('sha1').update(tempStr).digest('hex')

    if (result == signature) {
        return true;
    } else {
        return false;
    }
}

/* GET users listing. */
router.get('/TokenTest', function (req, res, next) {
    //若确认此次GET请求来自微信服务器，请原样返回echostr参数内容，则接入生效，成为开发者成功，否则接入失败。
    // console.log(req.query.signature, req.query.timestamp, req.query.nonce, req.query.echostr);

    if (checkSignature(req.query)) {
        //验证成功
        res.send(req.query.echostr);
    }
});

router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});



module.exports = router;