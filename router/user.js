import express from "express"
import { getimgid } from "./../util/user.js"
import { login, regUser } from "./../util/admin.js"

const router = express.Router()

// 获取图片id
router.get('/getimgid', getimgid )
//登录后台
router.post("/login", login)
//注册后台
router.post("/reguser", regUser) 

export default router