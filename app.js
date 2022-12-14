import express from "express";
import cors from "cors";
import userRouter from "./router/user.js";
import adminRouter from "./router/admin.js";
import expjwt from "express-jwt";//token
import config from "./config.js";
const app = express()
app.use(cors())
//({密码，排除不需要身份认证的地址})
app.use(expjwt({ secret: config.jwtSecretKey }).unless({ path: [/^\/api|download\//]}))
//配置解析表单数据的中间件
app.use(express.urlencoded({ extended: false }))
//用户路由
app.use('/api', userRouter)
//后台路由
app.use('/admin', adminRouter)
app.use('/download', express.static("./download"))

//监听
app.listen(5139, () => {
  console.log('监听')
})
//定义错误中间件
app.use((err, req, res, next) => {
  if (err.name == 'UnauthorizedError')
    return res.send({
      status: 0,
      msg:"NO_Permissions_#root"//无权限
    })
 return res.send(err)
})
