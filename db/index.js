//导入mysql
import mysql from "mysql";
//配置
export const db = mysql.createPool({
    host: '59.110.167.16',
    port: 3306,
    user: 'flower',
    password: 'zhaozhuo',
    // 数据库名称
    database: 'flower'
})
// db.query('select 1', (err, res) => {
//     if (err) return console.log(err.message);//如果运行这段代码说明有问题
//     console.log(res);   //[ RowDataPacket { '1': 1 } ] 说明成功
//     //共享数据库 
//  db