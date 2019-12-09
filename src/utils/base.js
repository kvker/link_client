import av from './av.js'
import util from './util.js'

export default class PageBase extends HTMLElement {
  constructor(template_id) {
    super()
    this.av = av
    this.util = util
    this.shadow = this.attachShadow({ mode: 'closed' }) // or open
    const temp = document.querySelector(template_id)
    const content = temp.content.cloneNode(true)
    if(this.init) {
      // 渲染前初始化获取数据
      this.init()
    }
    this.shadow.appendChild(content)
  }

  get user() {
    return AV.User.current()
  }

  /**
   * querySelector
   * @param {string} selector 选择器
   */
  qs(selector) {
    return this.shadow.querySelector(selector)
  }

  /**
   * leancloud错误返回处理
   * @param {object} error 错误对象
   */
  handleAVError(error) {
    console.log(error)
    this.util.modal.toggleShow({
      content: error.rawMessage,
    })
  }

  /**
   * 页面内的modal显示隐藏
   * @param {string}} selector modal选择器
   */
  toggleModal(selector) {
    const modal = this.qs(selector)
    modal.checked = !modal.checked
  }

  /**
   * 退出
   */
  logout() {
    AV.User.logOut()
    this.util.route.login()
  }
}