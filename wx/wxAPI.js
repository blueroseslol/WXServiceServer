const request = require('request')
const qs = require('querystring');
const config = require('../config');
const fs = require('fs');

/*
 * 根据appid,secret获取access_token
 */
function GetAccessToken() {
    let reqUrl = config.wxAPI + '/token?';
    let params = {
        grant_type: 'client_credential',
        appid: config.appId,
        secret: config.appSecret
    };

    let options = {
        method: 'get',
        url: reqUrl + qs.stringify(params)
    };
    // console.log("GetAccessToken()=>RequestUrl:", options.url);

    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if (res) {
                let token = JSON.parse(body);
                token.get_time = new Date();
                console.log("GetAccessToken()=>Result:", body);

                global.AccessToken = token.access_token;
                // console.log("GlobalVariable:", global.AccessToken);
                // fs.writeFile('./token', JSON.stringify(token), function (err) { console.error(err) });

                resolve(token.access_token);
            } else {
                reject(err);
            }
        });
    });
}

var menus = {
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
    let options = {
        url: config.wxAPI + '/menu/create?access_token=' + global.AccessToken,
        form: JSON.stringify(menus),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    request.post(options, function (err, res, body) {
        if (err) {
            console.error("CreateMenu:", err)
        } else {
            console.log("CreateMenu():", body);
        }
    });
}

// 开发者在根据开发文档的要求完成开发后，使用6.0.2版及以上版本的微信用户在与公众号进行客服沟通，公众号使用不同的客服账号进行回复后，用户可以看到对应的客服头像和昵称。
// 请注意，必须先在公众平台官网为公众号设置微信号后才能使用该能力
/*
 * 增加客服
 */
function AddCustomerService() {
    let temp = {
        "kf_account": "123456",
        "nickname": "客服1",
        "password": "123456"
    }

    let options = {
        url: config.wxAPI + '/customservice/kfaccount/add?access_token=' + global.AccessToken,
        form: JSON.stringify(temp),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    request.post(options, function (err, res, body) {
        if (err) {
            console.error("AddCustomerService:", err)
        } else {
            console.log("AddCustomerService():", body);
        }
    });
}

/*
 * 模板信息
 */
//发送模板信息
function TemplateMessage() {
    let temp = {
        "touser": "OPENID",
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
    }

    let options = {
        url: config.wxAPI + '/message/template/send?access_token=' + global.AccessToken,
        form: JSON.stringify(temp),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    request.post(options, function (err, res, body) {
        if (err) {
            console.error("TemplateMessage:", err)
        } else {
            console.log("TemplateMessage():", body);
        }
    });
}

/*
 * 通过mediaId来获取资源
 */
function getMaterial(mediaId, permanent) {
    var that = this;
    var getUrl = permanent ? api.getPermMaterial : api.getTempMaterial;
    return new Promise(function (resolve, reject) {
        that.fetchAccessToken().then(function (data) {
            var url = getUrl + 'access_token=' + data.access_token;
            if (!permanent) url += '&media_id=' + mediaId;
            resolve(url)
        });
    });
}

function uploadTempMaterial(type, filepath) {
    var that = this;
    var form = {  //构造表单
        media: fs.createReadStream(filepath)
    }
    return new Promise(function (resolve, reject) {
        that.fetchAccessToken().then(function (data) {

            var url = api.uploadMaterial + 'access_token=' + data.access_token + '&type=' + type;
            request({ url: url, method: 'POST', formData: form, json: true }).then(function (response) {
                var _data = response.body;
                if (_data) {
                    resolve(_data)
                } else {
                    throw new Error('upload material failed!');
                }
            }).catch(function (err) {
                reject(err);
            });
        });
    });
}

/*
 * 用户管理
 */
function GetUserData(openId) {
    let options = {
        url: config.wxAPI + '/user/info?access_token=' + global.AccessToken + "&openid=" + openId + "&lang=zh_CN",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    //console.log("GetUserData()=>RequestUrl:", options.url);

    return new Promise((resolve, reject) => {
        request(options, function (err, res, body) {
            if (res) {
                //参数见
                //https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html#UinonId
                resolve(body);
            } else {
                reject(err);
            }
        });
    });
}

module.exports = { CreateMenu, GetAccessToken, GetUserData };