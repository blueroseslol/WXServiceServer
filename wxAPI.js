const request = require('request')
const qs = require('querystring');
const config = require('./config');
const fs=require('fs');

/*
 * 根据appid,secret获取access_token
 */
function GetAccessToken() {
    let reqUrl = config.wxAPI+'/token?';
    let params = {
        grant_type: 'client_credential',
        appid: config.appId,
        secret: config.appSecret
    };

    let options = {
        method: 'get',
        url: reqUrl+qs.stringify(params)
    };
    console.log("GetAccessToken()=>RequestUrl:",options.url);

    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
        if (res) {
            let token=res['access_token'];
            console.log("GetAccessToken()=>Result:",body);
            console.log(body.access_token);
            console.log(token);
            
            fs.writeFile('./token', token, function (err) {console.error(err)});
            console.log(global.AccessToken);
            resolve(body);
        } else {
            reject(err);
        }
        });
    });
}


 
//常用type为view和click,分别为点击事件和链接
var menus = {
    "button": [
        {
            "name": "扫码", 
            "sub_button": [
                {
                    "type": "scancode_waitmsg", 
                    "name": "扫码带提示", 
                    "key": "rselfmenu_0_0", 
                    "sub_button": [ ]
                }, 
                {
                    "type": "scancode_push", 
                    "name": "扫码推事件", 
                    "key": "rselfmenu_0_1", 
                    "sub_button": [ ]
                }
            ]
        }, 
        {
            "name": "发图", 
            "sub_button": [
                {
                    "type": "pic_sysphoto", 
                    "name": "系统拍照发图", 
                    "key": "rselfmenu_1_0", 
                   "sub_button": [ ]
                 }, 
                {
                    "type": "pic_photo_or_album", 
                    "name": "拍照或者相册发图", 
                    "key": "rselfmenu_1_1", 
                    "sub_button": [ ]
                }, 
                {
                    "type": "pic_weixin", 
                    "name": "微信相册发图", 
                    "key": "rselfmenu_1_2", 
                    "sub_button": [ ]
                }
            ]
        }, 
        {
            "name": "发送位置", 
            "type": "location_select", 
            "key": "rselfmenu_2_0"
        },
        {
           "type": "media_id", 
           "name": "图片", 
           "media_id": "MEDIA_ID1"
        }, 
        {
           "type": "view_limited", 
           "name": "图文消息", 
           "media_id": "MEDIA_ID2"
        }
    ]
};
 
function CreateMenu() {
    let options = {
        url: config.wxAPI+'/menu/create?access_token=' + global.AccessToken,
        form: JSON.stringify(menus),
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    
    request.post(options, function (err, res, body) {
        if (err) {
            console.error(err)
        }else {
            console.log(body);
        }
    });
}

module.exports = {CreateMenu,GetAccessToken};