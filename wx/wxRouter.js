var express = require('express');
var crypto = require('crypto');
var router = express.Router();
const request = require('request')
const path=require('path');
const qs = require('querystring');
const parseString = require('xml2js').parseString;
const fs=require("fs");
const config = require('../config');
const msg = require("./wxMessage");
const mysql=require("../module/");
/*
 * 数据接入测试
 */
function CheckSignature(query) {
    let signature = query.signature;
    let timestamp = query.timestamp;
    let nonce = query.nonce;

    let tmpArr = [config.token, timestamp, nonce];
    let tempStr = tmpArr.sort().join('');
    let result = crypto.createHash('sha1').update(tempStr.toString().replace(/,/g, ""), 'utf-8').digest('hex');

    if (result == signature) {
        return true;
    } else {
        return false;
    }
}

router.get('/MessageProcess', (req, res, next) => {
    //若确认此次GET请求来自微信服务器，请原样返回echostr参数内容，则接入生效，成为开发者成功，否则接入失败。
    // console.log(req.query.signature, req.query.timestamp, req.query.nonce, req.query.echostr);

    if (CheckSignature(req.query)) {
        res.send(req.query.echostr);
    } else {
        res.send(false);
    }
});

router.post('/MessageProcess', (req, res, next) => {

    let buffer = [];
    req.on('data', function (data) {
        buffer.push(data);
    });
    req.on('end', function () {
        let msgXml = Buffer.concat(buffer).toString('utf-8');

        parseString(msgXml, { explicitArray: false }, (err, result) => {
            if (err) throw err;
            result = result.xml;
            // console.log(result);
            let toUser = result.ToUserName;
            let fromUser = result.FromUserName;
            //回复普通消息
            if (result.MsgType === "text") {
                res.send(msg.textMsg(toUser, fromUser, msg.message(result.Content)));
            } else if (result.MsgType === "image") {//回复图片
                //在这里图片相当于素材，用户发送的素材只是临时素材，只能在微信服务器保存三天，回复思路：
                //先上传素材---先封装一个post请求，然后通过素材接口获取media_id来获取素材
                //上传素材就需要封装post get以及素材上传的api
                //注意在上传素材时需要access_token所以也需要封装获取access_token的api
                /*
                var urlPath = path.join(__dirname, "../material/timg.jpg");
                that.uploadFile(urlPath, "image").then(function (mdeia_id) {
                    resultXml = msg.imgMsg(fromUser, toUser, mdeia_id);
                    res.send(resultXml);
                });
                */
               
                console.log( path.join(__dirname,'../'),process.cwd());
                
                request(result.PicUrl).pipe(fs.createWriteStream(`${process.cwd()}/public/uploads/${path.basename(result.PicUrl)}`)).on((err)=>{
                    mysql
                });
            }

            if (result.MsgType === 'event') {
                if (result.Event === 'subscribe') {
                    if (result.EventKey) {
                        console.log('扫描二维码关注：' + result.EventKey + ' ' + result.ticket);
                    }
                    this.body = '终于等到你，还好我没放弃';
                } else if (result.Event === 'unsubscribe') {
                    this.body = '';
                    console.log(result.FromUserName + ' 悄悄地走了...');
                } else if (result.Event === 'LOCATION') {
                    this.body = '您上报的地理位置是：' + result.Latitude + ',' + result.Longitude;
                } else if (result.Event === 'CLICK') {
                    this.body = '您点击了菜单：' + message.EventKey;
                } else if (result.Event === 'SCAN') {
                    this.body = '关注后扫描二维码：' + result.Ticket;
                }
            }
        });
    });
});

module.exports = router;