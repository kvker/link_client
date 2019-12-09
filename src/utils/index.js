import av from './js/av.js'
import util from './js/util.js'
import AV from 'leancloud-storage.js'
const user = AV.User.current()
if(user) {
  util.route.main()
} else {
  util.route.login()
}
// 用户点击操作, 1登录2注册
let user_ctrl_type = 1

login_btn.addEventListener('click', e => {
  user_ctrl_type = 1
  checkUserForm()
})
regist_btn.addEventListener('click', e => {
  user_ctrl_type = 2
  checkUserForm()
})

function checkUserForm() {
  const username = username_input.value
  const password = password_input.value
  const username_regexp = new RegExp(util.regexp.username)
  if(!username_regexp.test(username) || password.trim().length < 6) {
    util.modal.toggleShow({
      content: `请输入正确邮件与密码`,
    })
  } else if(user_ctrl_type === 1) {
    // 登录不弹框
    loginOrRegist()
  } else {
    // 注册弹这个
    util.modal.toggleShow({
      content: `注册账密为: ${username}, ${password}, 请确认`,
    })
  }
}

async function loginOrRegist() {
  const username = username_input.value
  const password = password_input.value
  const md5_password = util.md5(password)
  // console.log(user_ctrl_type)
  if(user_ctrl_type === 1) {
    try {
      // 登录
      await av.login({
        username,
        password: md5_password,
      })
      console.log(AV.User.current())
      util.route.main()
    } catch(error) {
      console.log(error)
    }
  } else {
    // 注册
    await av.regist({
      username,
      password: md5_password,
    })
    util.modal.toggleShow()
  }
}

modal_confirm.addEventListener('click', loginOrRegist)