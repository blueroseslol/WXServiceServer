exports.textMsg = function (toUser, fromUser, content) {
    let resultXml = "<xml><ToUserName><![CDATA[" + toUser + "]]></ToUserName>";
    resultXml += "<FromUserName><![CDATA[" + fromUser + "]]></FromUserName>";
    resultXml += "<CreateTime>" + new Date().getTime() + "</CreateTime>";
    resultXml += "<MsgType><![CDATA[text]]></MsgType>";
    resultXml += "<Content><![CDATA[" + content + "]]></Content></xml>";
    return resultXml;
}

//图文消息
exports.graphicMsg = function (toUser, fromUser, contentArr) {
    var xmlContent = "<xml><ToUserName><![CDATA[" + toUser + "]]></ToUserName>";
    xmlContent += "<FromUserName><![CDATA[" + fromUser + "]]></FromUserName>";
    xmlContent += "<CreateTime>" + new Date().getTime() + "</CreateTime>";
    xmlContent += "<MsgType><![CDATA[news]]></MsgType>";
    xmlContent += "<ArticleCount>" + contentArr.length + "</ArticleCount>";
    xmlContent += "<Articles>";
    contentArr.map((item, index) => {
        xmlContent += "<item>";
        xmlContent += "<Title><![CDATA[" + item.Title + "]]></Title>";
        xmlContent += "<Description><![CDATA[" + item.Description + "]]></Description>";
        xmlContent += "<PicUrl><![CDATA[" + item.PicUrl + "]]></PicUrl>";
        xmlContent += "<Url><![CDATA[" + item.Url + "]]></Url>";
        xmlContent += "</item>";
    });
    xmlContent += "</Articles></xml>";
    return xmlContent;
}

//转发消息给客服
exports.transferCustomerService = function (toUser, fromUser) {
    let resultXml = `<xml>
     <ToUserName><![CDATA[${toUser}]]></ToUserName>
     <FromUserName><![CDATA[${fromUser}]]></FromUserName>
     <CreateTime>${new Date().getTime()}</CreateTime>
     <MsgType><![CDATA[transfer_customer_service]]></MsgType></xml>`;
    return resultXml;
}

//设置自动回复内容
exports.message = function (data) {
    console.log("wxMessage:", data)
    let content;
    if (data === "你好" || data === "hello" || data === "hi") {
        content = "欢迎光临!"
    } else {
        content = "公众号还在升级，敬请期待!";
    }
    return content;
}
//回复图片消息
exports.imgMsg = function (toUser, fromUser, media_id) {
    let xmlContent = "<xml><ToUserName><![CDATA[" + toUser + "]]></ToUserName>";
    xmlContent += "<FromUserName><![CDATA[" + fromUser + "]]></FromUserName>";
    xmlContent += "<CreateTime>" + new Date().getTime() + "</CreateTime>";
    xmlContent += "<MsgType><![CDATA[image]]></MsgType>";
    xmlContent += "<Image><MediaId><![CDATA[" + media_id + "]]></MediaId></Image></xml>";
    return xmlContent;
}

//视频信息

exports.videoMsg = function (toUser, fromUser, media_id, title, description) {
    return `<xml>
                <ToUserName><![CDATA[${toUser}]]></ToUserName>
                <FromUserName><![CDATA[${fromUser}]]></FromUserName>
                <CreateTime>${new Date().getTime()}</CreateTime>
                <MsgType><![CDATA[video]]></MsgType>
                <Video>
                    <MediaId><![CDATA[${media_id}]]></MediaId>
                    <Title><![CDATA[${title}]]></Title>
                    <Description><![CDATA[${description}]]></Description>
                </Video>
            </xml>`;
}