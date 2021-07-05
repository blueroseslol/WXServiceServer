var schedule = require("node-schedule");
var fs = require("fs");
var path = require('path');
//每月执行任务
var rule1     = new schedule.RecurrenceRule();
//rule1.month  = times1;
rule1.month  = 1;

function deleteTempUploadFile(path) {
    var folder_exists = fs.existsSync(path);
    if (folder_exists === true) {
        var dirList = fs.readdirSync(path);
        dirList.forEach(function (fileName) {
            fs.unlinkSync(path + fileName);
        });
    }
}
/*
* 因为在文件移动出错时会删除文件，所以计划任务展示不用了，启用需要到app.js启动！
* */
module.exports = function () {
    //每月删除上传文件夹中的文件
    schedule.scheduleJob(rule1, function(){
        var newPath= process.cwd()+ '/public/uploads/';
        deleteTempUploadFile(newPath);
        console.log('删除上传文件夹中的文件！')
    });
};
