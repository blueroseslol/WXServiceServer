/**
 * Created by creaform on 2017/7/5.
 */
const mysql=require("mysql");
const settings=require('../config');
const pool = mysql.createPool({
    host: settings.MysqlSetting.host,
    user: settings.MysqlSetting.user,
    password: settings.MysqlSetting.password,
    database: settings.MysqlSetting.database,
    port:settings.MysqlSetting.port
});

// var query=function(sql,callback){
//     pool.getConnection(function(err,conn){
//         if(err){
//             callback(err,null,null);
//         }else{
//             conn.query(sql,function(err,rows,fields){
//                 //释放连接
//                 conn.release();
//                 //事件驱动回调
//                 callback(err,rows,fields);
//             });
//         }
//     });
// };

module.exports={
    simpleQuery:function (sql,params) {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function(err,conn){
            if(err){
                reject(err);
            }else{
                conn.query(sql,params,function(err,rows,fields){
                    //释放连接
                    conn.release();
                    //传递Promise回调对象
                    if(err)
                    {reject(err)}
                    resolve({"err":err,
                        "rows":rows,
                        "fields":fields});
                });
            }
        });
    });
},
    // execTrans(sqlParamsEntity, function(err, info){
    //     if(err){
    //         console.error("事务执行失败");
    //     }else{
    //         console.log("done.");
    //     }
    // })
    execTrans:function (sqlparamsEntities, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                return callback(err, null);
            }
            console.log("开始执行transaction，共执行" + sqlparamsEntities.length + "条数据");
            var funcAry = [];
            sqlparamsEntities.forEach(function (sql_param) {
                var temp = function (cb) {
                    var sql = sql_param.sql;
                    var param = sql_param.params;
                    connection.query(sql, param, function (tErr, rows, fields) {
                        if (tErr) {
                            connection.rollback(function () {
                                console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                                throw tErr;
                            });
                        } else {
                            return cb(null, 'ok');
                        }
                    })
                };
                funcAry.push(temp);
            });

            async.series(funcAry, function (err, result) {
                console.log("transaction error: " + err);
                if (err) {
                    connection.rollback(function (err) {
                        console.log("transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                    connection.commit(function (err, info) {
                        console.log("transaction info: " + JSON.stringify(info));
                        if (err) {
                            console.log("执行事务失败，" + err);
                            connection.rollback(function (err) {
                                console.log("transaction error: " + err);
                                connection.release();
                                return callback(err, null);
                            });
                        } else {
                            connection.release();
                            return callback(null, info);
                        }
                    })
                }
            })
        });
    });
},
    pool:pool,
    query:function (conn, sql, params,callback) {
        conn.query(sql,params,function(err,rows,fields){
            if(err)
            {console.log(err);}
            return callback(
                {"err":err,
                "rows":rows,
                "fields":fields});
        });
    },
    queryAsync:function(conn,sql,params,receiveErr){
        return new Promise(function (resolve, reject){
            if (receiveErr)
            {reject(receiveErr)}
            conn.query(sql,params,function(err,rows,fields){
                //传递Promise回调对象
                if(err)
                {reject(err)}
                resolve({"err":err,
                    "rows":rows,
                    "fields":fields});
            });
        });
    }

};