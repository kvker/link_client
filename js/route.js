import LoginPage from '../page/login/index.js'
import MainPage from '../page/main/index.js'

export default {
  login() {
    customElements.define('login-page', LoginPage)
    login_page.style.display = 'block'
    main_page.style.display = 'none'
    loading_page.style.display = 'none'
    main_page.innerHTML = ''
  },
  main() {
    customElements.define('main-page', MainPage)
    main_page.style.display = 'block'
    login_page.style.display = 'none'
    loading_page.style.display = 'none'
  },
}