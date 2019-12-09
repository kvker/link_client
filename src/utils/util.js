import modal from './modal.js'
import regexp from './regexp.js'
import route from './route.js'
// 功能函数临时储存器
let doLastTimeout, doLastOperates = []
let timeout = 500

export default {
  /**
   * 消抖，异步执行的多个操作，只执行最后一个操作，比如输入内容检索
   * @param {function} operate 传入的操作
   * @param {number} idx (可选)执行特性索引号的操作，一般不会用到
   */
  debounce(operate, time = timeout, idx) {
    if (typeof operate !== 'function') {
      throw '执行doLast函数报错：需要传入函数！'
    }
    clearTimeout(doLastTimeout)
    doLastTimeout = setTimeout(() => {
      let lastOperate = doLastOperates[doLastOperates.length - 1]
      lastOperate()
      doLastOperates = []
      clearTimeout(doLastTimeout)
      doLastTimeout = null
    }, time)
    doLastOperates.push(operate)
  },
  /**
   * 节流，某瞬间同步执行的多个操作，只执行最后一个操作，比如同时多个网络请求返回然后提示消息
   * @param {function} operate 传入的操作
   * @param {number} idx (可选)执行特性索引号的操作，一般不会用到
   */
  throttle(operate, time = timeout, idx) {
    if (typeof operate !== 'function') {
      throw '执行doLast函数报错：需要传入函数！'
    }
    if (!doLastTimeout) {
      doLastTimeout = setTimeout(() => {
        let lastOperate = doLastOperates[doLastOperates.length - 1]
        lastOperate()
        doLastOperates = []
        clearTimeout(doLastTimeout)
        doLastTimeout = null
      }, time)
    }
    doLastOperates.push(operate)
  },
  /**
   * 数字整数部分保持一定长度，不足用0补充，比如时间
   * @params {number} num 传入的数字
   * @params {number} length 数字左侧留着的长度，默认2是作为常用倒计时
   */
  pointLeftNumberLength(num, length = 2) {
    if(typeof(num) === 'number') {
      let numStr = String(num)
      let leftLength = numStr.split('.')[0].length
      if(length > leftLength) {
        let lengthCut = length - leftLength
        let zeroStr = Array.from({length: lengthCut}, () => '0').join('')
        numStr = zeroStr + numStr
      }
      return numStr
    } else {
      throw '传数字类型!'
    }
  },
  /**
   * 使用dayjs格式化日期
   * @param {any} time 时间
   * @param {string} format 定制格式
   */
  formatDate(time, format) {
    return dayjs(time).format(format || 'YYYY-MM-DD')
  },
  /**
   * 对比今天是明天今天昨天前天等
   * @param {any} time 时间
   */
  formatDateDayByDay(time) {
    let cur = dayjs()
    let diff = dayjs(time).diff(cur, 'day')
    console.log(diff)
    if (Math.abs(diff) > 2) {
      return dayjs(time).format('YYYY-MM-DD')
    } else {
      let res
      switch (diff) {
        case 2:
          res = '后天'
          break
        case 1:
          res = '明天'
          break
        case 0:
          res = '今天'
          break
        case -1:
          res = '昨天'
          break
        case -2:
          res = '前天'
          break
      }
      return res
    }
  },
  showLoading(selector) {
    const loading = document.querySelector(selector || '#loading')
    loading.style.display = 'flex'
  },
  hideLoading(selector) {
    const loading = document.querySelector(selector || '#loading')
    loading.style.display = 'none'
  },
  // 弹出框处理
  modal,
  // 正则表达式
  regexp,
  // 路由
  route,
}