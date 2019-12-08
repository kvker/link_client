import PageBase from '../../js/base.js'
import util from '../../js/util.js'
import av from '../../js/av.js'

export default class LoginPage extends PageBase {
  constructor() {
    super('#login_temp')

    // 用户点击操作, 1登录2注册
    this.user_ctrl_type = 1

    this.qs('#login_btn').addEventListener('click', e => {
      this.user_ctrl_type = 1
      this.checkUserForm()
    })
    this.qs('#regist_btn').addEventListener('click', e => {
      this.user_ctrl_type = 2
      this.checkUserForm()
    })

    this.qs('#modal_confirm').addEventListener('click', this.loginOrRegist.bind(this))
  }

  checkUserForm() {
    const username = this.qs('#username_input').value
    const password = this.qs('#password_input').value
    const username_regexp = new RegExp(util.regexp.username)
    if(!username_regexp.test(username) || password.trim().length < 6) {
      util.modal.toggleShow({
        content: `请输入正确邮件与密码`,
      })
    } else if(this.user_ctrl_type === 1) {
      // 登录不弹框
      this.loginOrRegist()
    } else {
      // 注册弹这个
      this.qs('#modal_content').innerText = `注册账密为: ${username}, ${password}, 请确认`
      this.qs('#modal').checked = true
    }
  }

  async loginOrRegist() {
    const username = this.qs('#username_input').value
    const password = this.qs('#password_input').value
    const md5_password = md5(password)
    // console.log(this.user_ctrl_type)
    util.showLoading()
      if(this.user_ctrl_type === 1) {
      try {
        // 登录
        await av.login({
          username,
          password: md5_password,
        })
        util.route.main()
      } catch(error) {
        console.log(Object.keys(error))
        this.util.modal.toggleShow({
          content: error.rawMessage
        })
      }
    } else {
      try {
        // 注册
        await av.regist({
          username,
          password: md5_password,
        })
        util.route.main()
      } catch(error) {
        console.log(error)
        this.util.modal.toggleShow({
          content: error.rawMessage
        })
      }
      this.qs('#modal').checked = false
    }
    util.hideLoading()
  }
}