export default {
  toggleShow({ selector = '#modal', title = '提示', content = '内容为空' } = {}) {
    const modal = document.querySelector(selector)
    document.querySelector(`${selector}_title`).textContent = title
    document.querySelector(`${selector}_content`).textContent = content
    modal.checked = !modal.checked
  },
}