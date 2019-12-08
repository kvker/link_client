import config from './config.js'

if(!(AV.applicationId && (AV.applicationKey || AV.masterKey))) {
  AV.init(config.LC)
}

export default {
  /**
   * av新增对象
   * @param {string} classs 新增对象的类
   * @param {object} params 新增参数
   */
  async create(classs, params) {
    try {
      return await (new (AV.Object.extend(classs))).set(params).save()
    } catch(err) {
      wx.showToast({
        title: err.message,
      })
    }
  },
  /**
   * av基础获取
   * @param {string} classs 搜索类名
   * @param {function} cbForQuery 设置查询条件的中介函数
   */
  async read(classs, cbForQuery, json) {
    let query = new AV.Query(classs)
    // 如果需要额外设置条件，则通过传入这个函数处理
    if(cbForQuery) {
      cbForQuery(query)
    }
    let res = await query.find()
    try {
      if(json) return res.map(i => i.toJSON())
      else return res
    } catch(err) {
      wx.showToast({
        title: err.message,
      })
    }
  },
  /**
   * av更新对象
   * @param {string} classs 更新对象的类
   * @param {string} id 更新对象的objectId
   * @param {object} params 更新内容
   */
  async update(classs, id, params) {
    let obj = AV.Object.createWithoutData(classs, id)
    // 设置属性
    for(const key in params) {
      if(params.hasOwnProperty(key)) {
        const element = params[key]
        obj.set(key, element)
      }
    }
    try {
      return await obj.save()
    } catch(err) {
      wx.showToast({
        title: err.message,
      })
    }
  },
  // 批量跟新
  async saveAll(objects) {
    try {
      return AV.Object.saveAll(objects)
    } catch(err) {
      wx.showToast({
        title: err.message,
      })
    }
  },
  /**
   * av删除对象
   * @param {string} classs 删除对象的类
   * @param {string} id 删除对象的objectId
   */
  async delete(classs, id) {
    let obj = AV.Object.createWithoutData(classs, id)
    try {
      return await obj.destroy()
    } catch(err) {
      wx.showToast({
        title: err.message,
      })
    }
  },
  /**
   * 上传资源文件
   * @param {string} pat 文件路径
   */
  async upload(path, json) {
    let res = await new AV.File(path, {
      blob: {
        uri: path,
      },
    }).save()
    if(json) return res.toJSON()
    else return res
  },
  /**
   * 登录
   */
  async login({ username, password }) {
    const user = await AV.User.logIn(username, password)
    return user
  },
  /**
   * 注册
   */
  async regist({ username, password }) {
    let user = new AV.User()
    user.set('username', username)
    user.set('password', password)
    user = await user.signUp()
    return user
  }
}