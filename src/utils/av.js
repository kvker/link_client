if(!(AV.applicationId && (AV.applicationKey || AV.masterKey))) {
  AV.init({
    appId: 'h7yi7AWU813r5FbiKqXWo7zC-9Nh9j0Va',
    appKey: 'HBMgkORRWCCgmdvkthe81pQ3',
    serverURLs: "https://h7yi7awu.lc-cn-e1-shared.com",
  })
}

export default {
  /**
   * av新增对象
   * @param {string} classs 新增对象的类
   * @param {object} params 新增参数
   */
  async create(classs, params) {
    return await (new (AV.Object.extend(classs))).set(params).save()
  },
  /**
   * av基础获取
   * @param {string} classs 搜索类名
   * @param {function} cbForQuery 设置查询条件的中介函数
   */
  async read(classs, cbForQuery) {
    let query = new AV.Query(classs)
    // 如果需要额外设置条件，则通过传入这个函数处理
    if(cbForQuery) {
      cbForQuery(query)
    }
    return await query.find()
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
    return await obj.save()
  },
  // 批量跟新
  async saveAll(objects) {
    return await AV.Object.saveAll(objects)
  },
  /**
   * av删除对象
   * @param {string} classs 删除对象的类
   * @param {string} id 删除对象的objectId
   */
  async delete(classs, id) {
    let obj = AV.Object.createWithoutData(classs, id)
    return await obj.destroy()
  },
  /**
   * 上传资源文件
   * @param {string} pat 文件路径
   */
  async upload(path) {
    return await new AV.File(path, {
      blob: {
        uri: path,
      },
    }).save()
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