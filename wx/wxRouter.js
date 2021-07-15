var express = require('express');
var router = express.Router();
const axios = require('axios');
// const path = require('path');
const xml2js = require('xml2js');
const parseString = xml2js.parseString;
const fs = require("fs");
const config = require('../config');
const msg = require("./wxMessage");
const mysql = require("../module/mysql");
const wxAPI = require("./wxAPI");
const formatDate = require('../module/formatDate');
//docx 系列
const docx = require("docx");
const Document = docx.Document;
const Packer = docx.Packer;
const Paragraph = docx.Paragraph;
const TextRun = docx.TextRun;
const ImageRun = docx.ImageRun;

router.get('/MessageProcess', (req, res, next) => {
    //若确认此次GET请求来自微信服务器，请原样返回echostr参数内容，则接入生效，成为开发者成功，否则接入失败。
    // console.log(req.query.signature, req.query.timestamp, req.query.nonce, req.query.echostr);

    if (wxAPI.CheckSignature(req.query)) {
        res.send(req.query.echostr);
    } else {
        res.send(false);
    }
});

router.put('/UpdateUserDate', (req, res, next) => {
    let getText = async (res, openid, contact, submitting_unit) => {
        await mysql.query("UPDATE `wxserviceserver`.`user` SET `contact`=?,`submitting_unit`=? WHERE `openid`=?;", [contact, submitting_unit, openid]);
        res.sendStatus(200);
    };

    getText(res, req.query.openid, req.query.contact, req.query.submitting_unit);
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

                    //模板消息实现
                    wxAPI.TemplateMessage(openid).catch(err => { console.log(err) });
                    //发送文字消息
                    res.send(msg.textMsg(fromUser, toUser, result.Content));

                    //转接客服
                    // res.send(msg.transferCustomerService(fromUser, toUser, result.Content));

                    //发送图文信息
                    /*
                    var contentArr = [
                        { Title: "Node.js 微信自定义菜单", Description: "使用Node.js实现自定义微信菜单", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72868520" },
                        { Title: "Node.js access_token的获取、存储及更新", Description: "Node.js access_token的获取、存储及更新", PicUrl: "http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72783631" },
                        { Title: "Node.js 接入微信公众平台开发", Description: "Node.js 接入微信公众平台开发", PicUrl: "http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast", Url: "http://blog.csdn.net/hvkcoder/article/details/72765279" }
                    ];
                    reportMsg = msg.graphicMsg(fromUser, toUser, contentArr);
                    res.send(reportMsg);
                    */
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
                    let currentTime = new Date();
                    let mediaPath = `./public/uploads/${formatDate.format(currentTime, 'yyyy-MM-dd')}_${formatDate.format(currentTime, 'hh-mm-ss')}.jpg`;

                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`, `mediaid`,`createTime`) VALUES (?,?,?,?);", [openId, 'image', mediaId, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);
                    await mysql.query("INSERT INTO `wxserviceserver`.`media` (`mediaid`,`mediaPath`) VALUES (?,?);", [mediaId, mediaPath]);

                    axios({
                        method: 'get',
                        url: picURL,
                        responseType: 'stream'
                    }).then((response) => {
                        response.data.pipe(fs.createWriteStream(mediaPath)).on('close', (err) => {
                            if (!err) {
                                res.send("success");
                            } else {
                                console.error(err);
                                res.send("系统出现错误！");
                            }
                        });
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
                    let currentTime = new Date();
                    let mediaPath = `./public/uploads/${formatDate.format(currentTime, 'yyyy-MM-dd')}_${formatDate.format(currentTime, 'hh-mm-ss')}.${format}`;

                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`,`messageText`,`createTime`) VALUES (?,?,?,?);", [openID, 'voice', `语音识别结果：${recognition}`, formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);
                    await mysql.query("INSERT INTO `wxserviceserver`.`media` (`mediaid`,`mediaPath`) VALUES (?,?);", [mediaID, mediaPath]);

                    axios({
                        method: 'get',
                        url: config.wxAPI + "/media/get?access_token=" + global.AccessToken + "&media_id=" + mediaID,
                        responseType: 'stream'
                    }).then((response) => {
                        response.data.pipe(fs.createWriteStream(mediaPath)).on('close', (err) => {
                            if (!err) {
                                res.send("success");
                            } else {
                                console.error(err);
                                res.send("系统出现错误！");
                            }
                        });
                    });
                };

                getVoice(res, result.FromUserName, result.MediaId, result.Format, result.Recognition, result.CreateTime);
            }
            //回复视频
            if (result.MsgType === 'video') {
                let getVideo = async (res, openID, mediaID, createTime) => {
                    let currentTime = new Date();
                    let mediaPath = `./public/uploads/${formatDate.format(currentTime, 'yyyy-MM-dd')}_${formatDate.format(currentTime, 'hh-mm-ss')}.mp4`;

                    await mysql.query("INSERT INTO `wxserviceserver`.`message` (`openid`, `messageType`,`createTime`) VALUES (?,?,?);", [openID, 'video', formatDate.format(new Date(createTime * 1000), 'yyyy-MM-dd')]);
                    await mysql.query("INSERT INTO `wxserviceserver`.`media` (`mediaid`,`mediaPath`) VALUES (?,?);", [mediaID, mediaPath]);

                    axios({
                        method: 'get',
                        url: config.wxAPI + "/media/get?access_token=" + global.AccessToken + "&media_id=" + mediaID,
                        responseType: 'stream'
                    }).then((response) => {
                        response.data.pipe(fs.createWriteStream(mediaPath)).on('close', (err) => {
                            if (!err) {
                                res.send("success");
                            } else {
                                console.error(err);
                                res.send("系统出现错误！");
                            }
                        });
                    });
                }

                getVideo(res, result.FromUserName, result.MediaId, result.CreateTime);
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
                    console.log('新用户:' + result.FromUserName + '于' + formatDate.format(new Date(result.CreateTime * 1000)) + "关注");

                    //未关注用户通过扫码关注
                    if (result.EventKey) {
                        console.log('二维码信息:' + result.EventKey + result.Ticket);
                    }

                    //获取用户信息并且保存到数据库中
                    let getUserBaseInfo = async (openid) => {
                        let userBaseInfo = await wxAPI.GetUserData(openid);
                        let bExistInfo = await mysql.query("SELECT * FROM wxserviceserver.user WHERE openid=?;", openid);

                        if (bExistInfo.results.length > 0) {
                            await mysql.query("UPDATE `wxserviceserver`.`user` SET `nickname`=?,`subscribe`=?,`country`=?,`province`=?,`city`=?,`headimgurl`=?,`subscribe_time`=?,`remark`=? WHERE `openid`=?;",
                                [userBaseInfo.nickname, userBaseInfo.subscribe, userBaseInfo.country, userBaseInfo.province, userBaseInfo.city, userBaseInfo.headimgurl, new Date(userBaseInfo.subscribe_time * 1000), userBaseInfo.remark, openid]).catch(err => { console.error(err); });
                        } else {
                            await mysql.query("INSERT INTO `wxserviceserver`.`user` (`openid`,`nickname`,`subscribe`,`country`,`province`,`city`,`headimgurl`,`subscribe_time`,`remark`) VALUES (?,?,?,?,?,?,?,?,?);",
                                [openid, userBaseInfo.nickname, userBaseInfo.subscribe, userBaseInfo.country, userBaseInfo.province, userBaseInfo.city, userBaseInfo.headimgurl, new Date(userBaseInfo.subscribe_time * 1000), userBaseInfo.remark]).catch(err => { console.error(err); });
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

router.get('/GenerateDoc', (req, res, next) => {
    let GenerateDoc = async () => {
        //收集各个用户的信息
        let bTimeRange = false;
        if (req.query.startTime && req.query.endTime) {
            let startTime = new Date(req.query.startTime);
            let endTime = new Date(req.query.endTime);
            bTimeRange = true;
        }

        let usersArray = (await mysql.query("SELECT * FROM wxserviceserver.user;")).results;
        for (let index in usersArray) {
            let openid = usersArray[index].openid;
            let nickname = usersArray[index].nickname;
            let province = usersArray[index].province;
            let city = usersArray[index].city;
            let subscribe_time = usersArray[index].subscribe_time;

            let messageArray = (await mysql.query("SELECT * FROM wxserviceserver.message where openid=?;", openid)).results;

            let title = new Paragraph({
                children: [
                    new TextRun(`${province}-${city}的${nickname}`),
                ],
            })

            let paragraphArray = [];
            paragraphArray.push(title);
            for (let index in messageArray) {
                let messageType = messageArray[index].messageType;
                let messageText = messageArray[index].messageText;
                let mediaid = messageArray[index].mediaid;
                let createTime = formatDate.format(new Date(messageArray[index].createTime), 'yyyy-MM-dd');

                if (messageType == "text") {
                    paragraphArray.push(new Paragraph({
                        children: [
                            new TextRun(`${messageText} ${createTime}`),
                        ]
                    }));
                } else if (messageType == "image") {
                    let mediaPath = (await mysql.query("SELECT * FROM wxserviceserver.media where mediaid=?;", mediaid)).results[0].mediaPath;
                    paragraphArray.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: fs.readFileSync(mediaPath),
                                transformation: {
                                    width: 200,
                                    height: 200,
                                }
                            })]
                    }));

                } else if (messageType == "voice") {
                    paragraphArray.push(new Paragraph({
                        children: [
                            new TextRun(`发送声音信息：${messageText} ${createTime}`),
                        ]
                    }));
                } else if (messageType == "video") {

                } else if (messageType == "location") {
                    paragraphArray.push(new Paragraph({
                        children: [
                            new TextRun(`发送位置信息：${messageText} ${createTime}`),
                        ]
                    }));
                }
            }

            let doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphArray
                }]
            });

            // Used to export the file into a .docx file
            Packer.toBuffer(doc).then((buffer) => {
                fs.writeFileSync(`./public/${province}-${city}-${nickname}.docx`, buffer);
            });
        }
    }

    GenerateDoc();
    res.sendStatus(200);
});

module.exports = router;