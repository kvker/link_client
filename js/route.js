import LoginPage from '../page/login/index.js'
import MainPage from '../page/main/index.js'

export default {
  login() {
    try {
      customElements.define('login-page', LoginPage)
    } catch(error) {
      console.warn(error)
    }
    login_page.style.display = 'block'
    main_page.style.display = 'none'
    loading_page.style.display = 'none'
    main_page.innerHTML = ''
  },
  main() {
    try {
      customElements.define('main-page', MainPage)
    } catch(error) {
      console.warn(error)
    }
    main_page.style.display = 'block'
    login_page.style.display = 'none'
    loading_page.style.display = 'none'
  },
}