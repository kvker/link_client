import PageBase from '../../js/base.js'

export default class MainPage extends PageBase {
  constructor() {
    super('#main_temp')
    this.qs('#username').innerText = this.user.get('username')
    this.qs('#search_input').addEventListener('keydown', this.changeSearchInput.bind(this))
    this.qs('#add_confirm').addEventListener('click', this.confirmAdd.bind(this))
    this.qs('#logout_btn').addEventListener('click', this.logout.bind(this))
    this.qs('#pre_btn').addEventListener('click', this.preList.bind(this))
    this.qs('#next_btn').addEventListener('click', this.nextList.bind(this))
    this.page = 0
    // 还有更多吗
    this.no_more = false
    this.getList()
  }

  /**
   * 获取列表
   * @param {number} page 页码
   */
  async getList(page = this.page) {
    try {
      const count = 20
      const list = await this.av.read('Contact', q => {
        q.limit(count)
        q.skip(page * count)
        q.equalTo('user', this.user)
      })
      if(list.length < count) {
        this.no_more = true
      }
      this.renderList(list)
      // 如果是第一页并且没有数据, 则显示没数据嘛
      if(!this.page && !list.length) {
        this.qs('#page_span').innerText = '没有数据'
      } else if(!list.length) {
        this.qs('#page_span').innerText = `第${this.page + 1}页, 没有数据`
      } else {
        this.qs('#page_span').innerText = `第${this.page + 1}页`
      }
    } catch(error) {
      this.handleAVError(error)
    }
  }

  preList() {
    if(!this.page) {
      this.util.modal.toggleShow({
        content: '已经第一页了',
      })
      return
    }
    this.no_more = false
    this.page -= 1
    this.getList()
  }

  nextList() {
    if(this.no_more) {
      this.util.modal.toggleShow({
        content: '没有更多了',
      })
      return
    }
    this.page += 1
    this.getList()
  }

  renderList(list) {
    let tr_list_str = ''
    list.forEach(item => {
      const json = item.toJSON()
      tr_list_str += `
        <tr>
          <td>${json.username}</td>
          <td>${json.phone}</td>
          <td>${json.profession}</td>
          <td>${json.remind}</td>
        </tr>
      `
    })
    this.qs('#tbody').innerHTML = tr_list_str
  }

  changeSearchInput(e) {
    if(e.keyCode === 13) {
      // 回车
      this.search(e.target.value)
    }
  }

  search(value) {
    console.log(value)
  }

  async confirmAdd() {
    const username = this.qs('#add_username').value
    const phone = this.qs('#add_phone').value
    const profession = this.qs('#add_profession').value
    const remind = this.qs('#add_remind').value
    if(!username || !phone || !profession || !remind) {
      console.log(this.util.modal)
      this.util.modal.toggleShow({
        content: '请输入全部内容'
      })
      return
    }
    console.log('confirmAdd')
    try {
      await this.av.create('Contact', {
        username,
        phone,
        profession,
        remind,
        user: this.user,
      })
      this.toggleModal('#modal_checkbox_add')
      this.util.modal.toggleShow({
        content: '新增成功',
      })
    } catch(error) {
      this.handleAVError(error)
    }
  }
}