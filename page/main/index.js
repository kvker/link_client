import PageBase from '../../js/base.js'
import util from '../../js/util.js'

export default class MainPage extends PageBase {
  constructor() {
    super('#main_temp')
    this.qs('#username').innerText = this.user.get('username')
    this.qs('#search_input').addEventListener('keydown', this.changeSearchInput.bind(this))
    this.qs('#add_confirm').addEventListener('click', this.confirmAdd.bind(this))
    this.qs('#logout_btn').addEventListener('click', this.logout.bind(this))
    this.getList()
  }

  /**
   * 获取列表
   * @param {number} page 页码
   */
  async getList(search_value = this.search_value) {
    util.showLoading()
    try {
      const list = (await this.av.read('Contact', q => {
        q.equalTo('user', this.user)
        if(this.search_value) {
          q.contains('username', search_value)
        }
        q.limit(1000)
      })).sort((a, b) => a.get('username').localeCompare(b.get('username'), 'zh-Hans-CN', { sensitivity: 'accent' }))
      this.qs('#list_count').innerText = `共${list.length}条`
      this.renderList(list)
    } catch(error) {
      this.handleAVError(error)
    }
    util.hideLoading()
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
    this.search_value = e.target.value
    if(e.keyCode === 13) {
      // 回车
      this.getList()
    }
  }

  async confirmAdd() {
    const username = this.qs('#add_username').value
    const phone = this.qs('#add_phone').value
    const profession = this.qs('#add_profession').value
    const remind = this.qs('#add_remind').value
    if(!username || !phone || !profession || !remind) {
      this.util.modal.toggleShow({
        content: '请输入全部内容'
      })
      return
    }
    util.showLoading()
    this.toggleModal('#modal_checkbox_add')
    // console.log('confirmAdd')
    const body = {
      username,
      phone,
      profession,
      remind,
      user: this.user,
    }
    try {
      await this.av.create('Contact', body)
      this.util.modal.toggleShow({
        content: '新增成功',
      })
      this.tableAddTempOne(body)
    } catch(error) {
      console.log(error)
      this.handleAVError(error)
    }
    util.hideLoading()
    this.cleanAddForm()
  }

  cleanAddForm() {
    this.qs('#add_username').value = ''
    this.qs('#add_phone').value = ''
    this.qs('#add_profession').value = ''
    this.qs('#add_remind').value = ''
  }

  /**
   * 新增成功临时加一条在后面
   * @param {object}} json 数据
   */
  tableAddTempOne(json) {
    const tr = document.createElement('tr')
    let td = document.createElement('td')
    td.innerText = json.username
    tr.appendChild(td)
    td = document.createElement('td')
    td.innerText = json.phone
    tr.appendChild(td)
    td = document.createElement('td')
    td.innerText = json.profession
    tr.appendChild(td)
    td = document.createElement('td')
    tr.appendChild(td)
    td.innerText = json.remind
    this.qs('#tbody').insertBefore(tr, this.qs('#tbody').children[0])
  }
}