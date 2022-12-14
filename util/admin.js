import baseurl from "../baseurl.js"
import path, { resolve } from "path"
import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// ########################################
import jsonwebtoken from "jsonwebtoken"
import bcrypt from "bcrypt"
import config from "../config.js"
import { db } from "./../db/index.js"
import { log } from "console";
// ##########################################
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//查询用户
const sqlregUser = 'select * from admin where username=?'
//add用户
const sqlregUseradd = 'insert into admin set ?'
/**
 * 获取所有的图片
 * 
 */
export const getimg = (req, res) => {
  var readDir = fs.readdirSync(path.resolve(__dirname, "./../download"))
  readDir.sort(function (a, b) {
    return b.split(".")[0] - a.split(".")[0];  //降序排列，return a-b; —>升序排列
  })
  let newarr = []
  let a = readDir.forEach(item => {
    newarr.push({
      id: item.split('.')[0],
      url: `${baseurl}/download/${item}`,
      flage: false
    })
  })
  if (readDir.length == 0) return res.send({
    status: 0,
    msg:"空空如也"
  })
  return res.send({
    status: 1,
    alllength: readDir.length,
    lastid: readDir[0],
    data: newarr,
    msg: `一共获取到${readDir.length}张图`,
  })
}
/**
 * 删除单个或多个图片 传图片ID数组
 */
export const deleteimg = (req, res) => {
  console.log(req.body["delarr[]"]); 
  if (req.body["delarr[]"]==undefined) return res.send({
    status: 0,
    msg: '删除项目不能为空'
  })
  let filepath = req.body['delarr[]']
  if (typeof filepath == 'string')
    filepath = [filepath]//解决传入一个id时候的bug
  new Promise((resolve, reject) => {
    for (let index = 0; index < filepath.length; index++) {
      fs.unlink(path.resolve(__dirname, `./../download/${filepath[index]}.jpg`), function (err) {
        if (err) {
          reject(err);
        }
        resolve()
      })
    }
  }).then(() => {
    return res.send({
      status: "1",
      msg: `删除${filepath.length}个文件成功`
    })
  }).catch(err => {
    return res.send({
      status: "0",
      msg: "删除失败部分文件不存在" +err.message,
    })
  })
}

/**
 * 上传图片
 */
export const addimg = (req, res) => {
  let newimgurl = []
  let lastimgid = req.lastimgid
  if (req.files.length === 0) {
    return res.send({
      msg: '文件上传不能为空',
      status: 0,
    })
  }
  let url = path.resolve(__dirname, "./../download") + "/"   //Win 
  new Promise((resolve, reject) => {
    for (let index = 0; index < req.files.length; index++) {
      let imgid = lastimgid * 1 + index * 1 + 1
      let oldname = `${url}${req.files[index].filename}`
      let newname = `${url}${imgid}.jpg`
      fs.rename(oldname, newname, (err) => {
        if (err) res.send({ err })
        if (index + 1 == req.files.length) {
          resolve()
        }
        newimgurl.push({ id: imgid, url: `${baseurl}/download/${imgid}.jpg` })
      })
    }
  }).then(() => {
    res.send({
      status: "1",
      msg: `成功上传${req.files.length}个文件`,
      newimgurl,
    })
  })

}

/**
 * 登录后台
 */
export const login = (req, res) => {
  let reqobj = req.body
  new Promise(function (resolve, reject) {
    db.query(sqlregUser, reqobj.username, (err, results) => {
      //sql语句错误
      if (err) return res.send({ status: err.sqlState, msg: "网络失败请重试-sql" })
      if (results.length == 0) return res.send({
        msg: '未注册', status: 0
      })
      console.log(reject.length);
      //用户存在
      resolve(results)
    })

  }).then(data => {
    if (!CompareSync(reqobj.password, data[0].password)) {
      return res.send({ msg: '账号或密码错误', status: 0 })
    }
    // return res.cc('成功登录',0)
    let user = { ...data[0], password: '' }
    //对用户信息加密，生成token字符串 （用户对象   秘钥   过期时间）
    let tokenStr = jsonwebtoken.sign(user, config.jwtSecretKey, { expiresIn: config.tokentime })
    return res.send({
      status: 1,
      msg: '成功登录',
      //方便前端使用
      token: 'Bearer ' + tokenStr,
    })
  })
}
/**
 * 注册后台
 * @param
 * @returns 
 * username:Admin2
  password:888888888
 */
export const regUser = (req, res) => {
  try {
    //2.3.1 检测用户名是否合法
    if (!req.body.username || !req.body.password) return res.send({
      status: 0,
      msg: 'Invalid username or password'
    })
        //2.3.1.1 检测用户名是否合法
    const patt = /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z\W_!@#$%^&*`~()-+=]+$)(?![a-z0-9]+$)(?![a-z\W_!@#$%^&*`~()-+=]+$)(?![0-9\W_!@#$%^&*`~()-+=]+$)[a-zA-Z0-9\W_!@#$%^&*`~()-+=]/
    if (!patt.test(req.body.username)) return res.send({ status: 0, msg: "用户名大写字母，小写字母，数字，特殊符号 `@#$%^&*`~()-+=` 中任意3项密码" })
    //2.3.2 检测用户名是否被占用
    new Promise(function (resolve, reject) {
      db.query(sqlregUser, [req.body.username], (err, results) => {
        if (err) {
          return res.send({ status: err.sqlState, msg: "网络失败请重试-sql" })
        }
        //用户名被占用 
        if (results.length > 0) {
          return res.send({ msg: '用户名被占用', status: 0 })
        }
        //可以使用的情况下
        req.body.password = HashSync(req.body.password)//加密用户密码
        // 2.3.4 插入新用户
        resolve(req.body)
      })
    }).then(resolve => {
      // 2.3.4 插入新用户
      db.query(sqlregUseradd, resolve, (err, results) => {
        if (err) {
          return res.send({ status: err.sqlState, msg: "网络失败请重试-sql" })
        }
        if (results.affectedRows != 1) {
          return res.send({
            msg: '注册失败',
            status: 0,
          })
        }
        return res.send({
          msg: '注册成功',
          status: 1,
        })
      })
    })
  } catch (error) {
    return res.send({
      msg: error,
      status: 0,
    })
  }

}
/**
 * 
 * 删除全部图片 
 *  Windows 系统
 */

export const deleteallimg = (req, res) => {
  fs.rename(path.resolve(__dirname, `./../download`), 'downloadbackup', (err) => {
    if (err) {
      return res.send({
        msg: "NO_file",
        status: 0,
      })
    }
    return res.send({
      msg: "全部文件删除成功",//实际修改文件地址
      status: 0,
    })
  })
}

/**
 * 
 * 删除全部图片 
 *  Linux系统
 */
// export const deleteallimg = (req, res) => {
//   let newurl = path.resolve(__dirname, `./../download`) + "/"

//   let oldurl = path.resolve(__dirname, `./../downloadbackup`) + "/"
//   fs.rename(newurl, oldurl, (err) => {
//     if (err) {
//       console.log(err)
//       return res.send({
//         msg: "NO_file",
//         status: 0,
//       })
//     }
//     return res.send({
//       msg: "全部文件删除成功",//实际修改文件地址
//       status: 0,
//     })
//   })
// }






// #######################内部非法#######################
// 加密
function HashSync(password) {
  return bcrypt.hashSync(password, 10)//明文密码 强度10
}
//解密
function CompareSync(userpassword, mysqlpassword) {
  return bcrypt.compareSync(userpassword, mysqlpassword)//明文密码 长度
}
