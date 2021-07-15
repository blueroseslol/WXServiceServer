const axios = require('axios');
const config = require('../config');
const fs = require('fs');
var crypto = require('crypto');

/*
 * 根据appid,secret获取access_token
 */
function GetAccessToken() {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${config.wxAPI}/token?`,
            params: {
                grant_type: 'client_credential',
                appid: config.appId,
                secret: config.appSecret
            }
        }).then((response) => {
            if (response) {
                console.log("GetAccessToken()=>Result:", response.data.access_token);
                global.AccessToken = response.data.access_token;
                resolve(response.data);
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

/*
 * 数据接入签名检测
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

let menus = {
    "button": [
        {
            "name": "扫码",
            "sub_button": [
                {
                    "type": "scancode_waitmsg",
                    "name": "扫码带提示",
                    "key": "rselfmenu_0_0",
                    "sub_button": []
                },
                {
                    "type": "scancode_push",
                    "name": "扫码推事件",
                    "key": "rselfmenu_0_1",
                    "sub_button": []
                },
                {
                    "type": "view",
                    "name": "搜索",
                    "url": "http://www.soso.com/"
                },
                {
                    "type": "click",
                    "name": "赞一下我们",
                    "key": "V1001_GOOD"
                },
            ]
        },
        {
            "name": "菜单",
            "sub_button": [
                {
                    "name": "发送位置",
                    "type": "location_select",
                    "key": "rselfmenu_2_0"
                }, {
                    "type": "pic_sysphoto",
                    "name": "系统拍照发图",
                    "key": "rselfmenu_1_0",
                    "sub_button": []
                },
                {
                    "type": "pic_photo_or_album",
                    "name": "拍照或者相册发图",
                    "key": "rselfmenu_1_1",
                    "sub_button": []
                },
                {
                    "type": "pic_weixin",
                    "name": "微信相册发图",
                    "key": "rselfmenu_1_2",
                    "sub_button": []
                }
                // {
                //     "type": "media_id",
                //     "name": "图片",
                //     "media_id": "MEDIA_ID1"
                // },
                // {
                //     "type": "view_limited",
                //     "name": "图文消息",
                //     "media_id": "MEDIA_ID2"
                // }
            ]
        }
    ]
};
/*
 * 微信菜单
 */
//创建微信菜单
function CreateMenu() {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: `${config.wxAPI}/menu/create?access_token=${global.AccessToken}`,
            data: menus,
            // headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then((response) => {
            console.log("CreateMenu():", response.data);
            resolve(response.data);
        }).catch((err) => {
            console.error("CreateMenu:", err);
            reject(err);
        });
    });
}

// 开发者在根据开发文档的要求完成开发后，使用6.0.2版及以上版本的微信用户在与公众号进行客服沟通，公众号使用不同的客服账号进行回复后，用户可以看到对应的客服头像和昵称。
// 请注意，必须先在公众平台官网为公众号设置微信号后才能使用该能力
/*
 * 增加客服
 */
function AddCustomerService() { }

/*
 * 模板信息
 */
//发送模板信息
function TemplateMessage(openid) {
    return new Promise((resolve, reject) => {
        let temp = {
            "touser": openid,
            "template_id": "JZiSU5Om3JBfaIJ8tN7U5odPgG7FzoRGTgk4ANBYQkE",
            "url": "http://weixin.qq.com/download",
            "topcolor": "#FF0000",
            "data": {
                "User": {
                    "value": "黄先生",
                    "color": "#173177"
                },
                "Date": {
                    "value": "06月07日 19时24分",
                    "color": "#173177"
                },
                "CardNumber": {
                    "value": "0426",
                    "color": "#173177"
                },
                "Type": {
                    "value": "消费",
                    "color": "#173177"
                },
                "Money": {
                    "value": "人民币260.00元",
                    "color": "#173177"
                },
                "DeadTime": {
                    "value": "06月07日19时24分",
                    "color": "#173177"
                },
                "Left": {
                    "value": "6504.09",
                    "color": "#173177"
                }
            }
        };

        axios({
            method: 'post',
            url: `${config.wxAPI}/message/template/send?access_token=${global.AccessToken}`,
            data: temp
        }).then((response) => {
            resolve(response.data);
        }).catch((err) => {
            reject(err);
        });
    });
}

/*
 * 通过mediaId来获取资源
 */
function GetTempMedia(mediaId) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${config.wxAPI}/media/get?access_token=${global.AccessToken}&media_id=${mediaId}`,
        }).then((response) => {
            resolve(response.data);
        }).catch((err) => {
            reject(err);
        });
    });
}

function GetMaterial(mediaId) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: `${config.wxAPI}/material/get_material?access_token=${global.AccessToken}&media_id=${mediaId}`,
        }).then((response) => {
            resolve(response.data);
        }).catch((err) => {
            reject(err);
        });
    });
}

/*
 * 用户管理
 */
function GetUserData(openId) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${config.wxAPI}/user/info?access_token=${global.AccessToken}&openid=${openId}&lang=zh_CN`,
        }).then((response) => {
            resolve(response.data);
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports = { CreateMenu, GetAccessToken, CheckSignature, TemplateMessage, GetTempMedia, GetMaterial, GetUserData };
