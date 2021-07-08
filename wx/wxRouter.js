var express = require('express');
var crypto = require('crypto');
var router = express.Router();
const axios = require('axios')
const request = require('request')
const path = require('path');
const parseString = require('xml2js').parseString;
const fs = require("fs");
// const md5 = crypto.createHash('md5');
const config = require('../config');
const msg = require("./wxMessage");
const mysql = require("../module/mysql");
const wxAPI = require("./wxAPI");
var formatDate = require('../module/formatDate');

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

        parseString(msgXml, { explicitArray: false }, function (err, result) {
            if (err) throw err;
            result = result.xml;
            // console.log("xml解析结果：" + JSON.stringify(result));
            let toUser = result.ToUserName;
            let fromUser = result.FromUserName;
            //回复普通消息
            if (result.MsgType === "text") {
                let getText = async (res, openid, text, createTime) => {
                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`, `messageText`,`createTime`) VALUES (?,?,?,?);", [openid, 'text', text, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);

                    res.send(msg.textMsg(toUser, fromUser, result.Content));
                };

                getText(res, result.FromUserName, result.Content, result.CreateTime);
            }

            //回复图片
            if (result.MsgType === "image") {
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
                let getImage = async (res, openId, mediaId, picURL, createTime) => {
                    let mediaPath = `./public/uploads/${Date.now().toString()}.jpg`;

                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`, `mediaid`,`createTime`) VALUES (?,?,?,?);", [openId, 'image', mediaId, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);
                    await mysql.query("INSERT INTO `wxserviceserver`.`media` (`mediaid`,`mediaPath`) VALUES (?,?);", [mediaId, mediaPath]);
                    request(picURL).pipe(fs.createWriteStream(mediaPath)).on('close', function (err) {
                        if (!err) {
                            res.send("success");
                        } else {
                            console.error(err);
                            res.send("系统出现错误！");
                        }
                    });
                };

                getImage(res, result.FromUserName, result.MediaId, result.PicUrl, result.CreateTime);
            }

            //回复位置
            if (result.MsgType === 'location') {
                // console.log(result.Label + result.Location_X + result.Location_Y + result.Scale);
                let getLocation = async (res, openId, label, locationX, locationY, createTime) => {
                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`,`messageText`,`createTime`) VALUES (?,?,?,?);", [openId, 'location', `${label}@${locationX}:${locationY}`, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);

                    res.send("success")
                };

                getLocation(res, result.FromUserName, result.Label, result.Location_X, result.Location_Y, result.CreateTime);
            }

            //回复语音
            if (result.MsgType === 'voice') {
                //下载语音文件并且获取文字转化结果

                let getVoice = async (res, openID, mediaID, format, recognition, createTime) => {
                    let options = {
                        method: 'get',
                        url: config.wxAPI + "/media/get?access_token=" + global.AccessToken + "&media_id=" + mediaID
                    };
                    let mediaPath = `./public/uploads/${Date.now().toString()}.${format}`;

                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`,`messageText`,`createTime`) VALUES (?,?,?,?);", [openID, 'voice', `语音识别结果：${recognition}`, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);
                    await mysql.query("INSERT INTO `wxserviceserver`.`media` (`mediaid`,`mediaPath`) VALUES (?,?);", [mediaID, mediaPath]);

                    request.get(options).pipe(fs.createWriteStream(mediaPath)).on('close', function (err) {
                        if (!err) {


                            res.send("success");
                        } else {
                            console.error(err);
                            res.send("系统出现错误！");
                        }
                    });
                };

                getVoice(res, result.FromUserName, result.MediaId, result.Format, result.Recognition, result.CreateTime);
            }
            //回复视频
            if (result.MsgType === 'video') {

            }
            //回复小视频
            if (result.MsgType === 'shortvideo') {

            }
            //回复链接
            if (result.MsgType === 'link') {

            }

            if (result.MsgType === 'event') {
                if (result.Event === 'subscribe') {
                    //用户关注
                    console.log('新用户:' + result.FromUserName + '于' + result.CreateTime + "关注");

                    //未关注用户通过扫码关注
                    if (result.EventKey) {
                        console.log('二维码信息:' + result.EventKey + result.Ticket);
                    }

                    //获取用户信息并且保存到数据库中
                    let getUserBaseInfo = async (openid) => {
                        let userBaseInfo = JSON.parse(await wxAPI.GetUserData(openid));
                        let bExistInfo = await mysql.query("SELECT * FROM wxserviceserver.user WHERE openid=?;", openid);

                        if (bExistInfo.results.length > 0) {
                            await mysql.query("UPDATE `wxserviceserver`.`user` SET `nickname`=?,`subscribe`=?,`country`=?,`province`=?,`city`=?,`headimgurl`=?,`subscribe_time`=?,`remark`=? WHERE `openid`=?;",
                                [userBaseInfo.nickname, userBaseInfo.subscribe, userBaseInfo.country, userBaseInfo.province, userBaseInfo.city, userBaseInfo.headimgurl, new Date(userBaseInfo.subscribe_time * 1000), userBaseInfo.remark, openid]).
                                then((error, results,) => {
                                    console.log(results);
                                    console.log(error);
                                });
                        } else {
                            await mysql.query("INSERT INTO `wxserviceserver`.`user` (`openid`,`nickname`,`subscribe`,`country`,`province`,`city`,`headimgurl`,`subscribe_time`,`remark`) VALUES (?,?,?,?,?,?,?,?,?);",
                                [openid, userBaseInfo.nickname, userBaseInfo.subscribe, userBaseInfo.country, userBaseInfo.province, userBaseInfo.city, userBaseInfo.headimgurl, new Date(userBaseInfo.subscribe_time * 1000), userBaseInfo.remark]);
                        }
                    };

                    getUserBaseInfo(result.FromUserName);

                    //新关注用户回复信息
                    this.body = '终于等到你，还好我没放弃';
                } else if (result.Event === 'unsubscribe') {
                    this.body = '';
                    console.log(result.FromUserName + ' 悄悄地走了...');
                } else if (result.Event === 'SCAN') {
                    //关注用户通过扫码进入
                    console.log('用户:' + result.FromUserName + '于' + result.CreateTime + "重新进入公众号");
                    if (result.EventKey) {
                        console.log('二维码信息:' + result.EventKey + result.Ticket);
                    }
                    this.body = '欢迎回来！';
                } else if (result.Event === 'LOCATION') {
                    this.body = '您上报的地理位置是：' + result.Latitude + ',' + result.Longitude;
                } else if (result.Event === 'CLICK') {
                    this.body = '您点击了菜单：' + message.EventKey;
                }
                res.send(msg.textMsg(toUser, fromUser, this.body));
            }
        });
    });
});

module.exports = router;