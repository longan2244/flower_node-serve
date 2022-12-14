import express from "express"
import multer from "multer"//处理上传文件
import path, { resolve } from "path"
import fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadFile = multer({ dest: path.resolve(__dirname, "./../download") });
import { getimg, deleteimg, addimg, deleteallimg } from "./../util/admin.js"
const router = express.Router()

// 获取所有图片长度  文件地址
router.get('/getimg', getimg)
//删除download文件夹（假）
router.post('/deleteallimg', deleteallimg)
//批量删除图片
router.post('/deleteimg', deleteimg)
//批量上传图片
router.post("/addimg", (req, res, next) => {
  // 上传文件之前获取最后一个id
  var readDir = fs.readdirSync(path.resolve(__dirname, "./../download"))
  readDir.sort(function (a, b) {
    return b.split(".")[0] - a.split(".")[0];  //降序排列，return a-b; —>升序排列
  })
  let lastimgid = readDir[0].split(".")[0]//最后一张图的ID
  if (lastimgid) {
    req.lastimgid = lastimgid
    next()
  }
  res.send({status:0,msg:"系统错误联系管理员A31"})
}, uploadFile.array("jpg"), addimg)
export default router