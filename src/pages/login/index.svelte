<script>
  import { push, pop, replace } from "svelte-spa-router";
  import Loading from "../../components/loading/index.svelte";
  import av from "../../utils/av.js";

  // 用户点击操作, 1登录2注册
  let user_ctrl_type = 1;
  let username = "";
  let password = "";
  let modal_content = "";
  let md5_password = "";

  let loading_show = false;
  $: {
    md5_password = md5(password);
  }

  async function login() {
    loading_show = true;
    try {
      // 登录
      await av.login({
        username,
        password: md5_password
      });
      push("/main");
    } catch (error) {
      console.log(Object.keys(error));
      alert(error.rawMessage);
    }
    loading_show = false;
  }

  function showModal() {
    if (!username || !password) {
      alert(`请输入账密`);
      return;
    } else if (password.length < 6) {
      alert(`密码不少于6位`);
      return;
    }
    if (confirm(`注册账密为: ${username}, ${password}, 请确认`)) {
      regist();
    }
  }

  async function regist() {
    loading_show = true;
    try {
      // 注册
      await av.regist({
        username,
        password: md5_password
      });
      push("/main");
    } catch (error) {
      console.log(error);
      alert(error.rawMessage);
    }
    loading_show = false;
  }
</script>

<style>
  #login_page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0 auto;
  }
  #login_page > * {
    margin: 8px 0;
  }
</style>

<div id="login_page" class="half">
  <h1>林克</h1>
  <!-- username, password -->
  <input bind:value={username} type="text" placeholder="用户名" value="kk" />
  <input
    bind:value={password}
    type="password"
    placeholder="密码, 不少于6位"
    value="aa123456" />
  <button class="full" on:click={login}>登录</button>
  <button class="full" on:click={showModal}>注册</button>
</div>

<Loading bind:show={loading_show} />
