export default {
  toggleShow({ selector = '#modal', title = '提示', content = '内容为空' } = {}) {
    const modal = document.querySelector(selector)
    document.querySelector(`${selector}_title`).innerText = title
    document.querySelector(`${selector}_content`).innerText = content
    modal.checked = !modal.checked
  },
}