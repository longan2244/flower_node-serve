// 导入数据库
import { db } from "./../db/index.js"
import baseurl from "../baseurl.js"
import path, { resolve } from "path"
import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//查询是否存在该用户
const search_IDmysq = 'select * from user where uid=?'
//添加UID
const add_usermysq = 'insert into user set ?'
// 主程序
export const getimgid = async (req, res) => {
      try {
            let uid = req.query.uid
            let IS_have = await search_ID(uid, res)   //查询是否存在这个人的ID
            if (IS_have) {//存在uid返回对应imgID
                  let img = await send_imgID(uid, res)
                  return res.send({
                        data: {
                              ...img

                        },
                        status: 1,
                  })
            }
            let addmsg = await add_user(uid, res)// 不存在uid——将uid存入数据库之后发送 imgid 自动++
            let new_img = await send_imgID(uid, res)
            return res.send({
                  data: {
                        ...new_img
                  },
                  status: 1,
            })
      } catch (error) {
            return res.send(error)
      }
}
//将用户存入数据库
function add_user(uid, res) {
      return new Promise((resolve, reject) => {
            let obj = {
                  uid: uid
            }
            db.query(add_usermysq, [obj], (err, results) => {
                  if (err) return res.send(err.message)
                  resolve("ok")
            })
      })
}
//查询是否存在的ID
/**
 * 
 * @param {*} uid 用户uid
 * @returns  true 代表存在  false代表不存在
 */
function search_ID(uid, res) {
      return new Promise((resolve, reject) => {
            db.query(search_IDmysq, [uid], (err, results) => {
                  if (err) return res.send(err.message)
                  if (results.length == 0) resolve(false)
                  resolve(true)
            })
      })
}
//发送imgID
function send_imgID(uid, res) {
      var readDir = fs.readdirSync(path.resolve(__dirname, "./../download"))
      return new Promise((resolve, reject) => {
            db.query(search_IDmysq, [uid], (err, results) => {
                  if (err) return res.send(err.message)
                  if (results.length == 0) reject(err)
                  // resolve(results[0].imgid % 2000) 对服务器图片数量取模  发送不大于服务器图ID
                  let imgid = results[0].imgid % readDir.length
                  resolve({
                        imgid,
                        imgurl: `${baseurl}/download/${imgid}.jpg`,
                  })
            })
      })
}