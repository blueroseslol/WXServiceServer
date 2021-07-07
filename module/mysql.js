/**
 * Created by creaform on 2017/7/5.
 */
const mysql = require("mysql");
const settings = require('../config');
const pool = mysql.createPool({
    host: settings.MysqlSetting.host,
    user: settings.MysqlSetting.user,
    password: settings.MysqlSetting.password,
    database: settings.MysqlSetting.database,
    port: settings.MysqlSetting.port
});

module.exports = {
    query: (sql, params) => {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, Connection) => {
                if (error) {
                    reject(error);
                } else {
                    Connection.query(sql, params, (error, results, fields) => {
                        Connection.release();
                        if (error) {
                            reject(error);
                        }
                        resolve({
                            "error": error,
                            "results": results,
                            "fields": fields
                        });
                    });
                }
            });
        });
    },
    //返回连接池
    pool: pool,
    //执行事务
    /*
    execTrans: function (sqlparamsEntities, callback) {
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
    */

    /*
     * 导出mysql库的函数
     */
    escape: mysql.escape,
};