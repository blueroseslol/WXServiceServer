var express = require('express');
var crypto = require('crypto');
var router = express.Router();

//全局变量
const base = {
    Token: "SendToken",
    appID: "c956e0308d1d096d1c82706eb96b1de0", //公众号的appid
    appsecret: "***", //公众号的secret
    wxapi: "https://api.weixin.qq.com/cgi-bin"
};

/*
 * 数据接入测试
 */
function checkSignature(query) {
    let signature = query.signature;
    let timestamp = query.timestamp;
    let nonce = query.nonce;

    //WX平台上设置的Token

    let tmpArr = [base.Token, timestamp, nonce];
    let tempStr = tmpArr.sort().join('');
    let result = crypto.createHash('sha1').update(tempStr).digest('hex')

    if (result == signature) {
        return true;
    } else {
        return false;
    }
}

/*
 * 根据appid,secret获取access_token
 */
function getAccessToken() {
    return new Promise((resolve, reject) => {
        request.get(`${base.wxapi}/token?grant_type=client_credential&appid=${base.appid}&secret=${base.secret}`, function (error, response, body) {
            if (error !== null) {
                reject("获取access_token失败 检查getAccessToken函数");
            }
            resolve(JSON.parse(body));
        });
    });
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