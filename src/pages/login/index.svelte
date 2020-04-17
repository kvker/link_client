<script>
  import { push, pop, replace } from "svelte-spa-router";
  import Loading from "../../components/loading/index.svelte";
  import av from "../../utils/av.js";

  // 表单字段
  let username = "";
  let password = "";

  // md5加密密码
  let md5_password = "";

  let loading_show = false;
  $: {
    md5_password = md5(password);
  }

  async function login() {
    if (username.length < 2 || !md5_password) {
      alert("请输入合法账密");
      return;
    }
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

  /**
   * 检测注册数据
   */
  function checkRegist() {
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

  /**
   * 注册
   */
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

</style>

<div class="container">
  <h1 class="text-center" style="margin-top: 200px;">林克</h1>
  <div class="row">
    <div class="col-8 offset-2 col-xl-4 offset-xl-4">
      <input
        class="form-control"
        bind:value={username}
        type="text"
        placeholder="用户名" />
    </div>
    <div class="col-8 offset-2 col-xl-4 offset-xl-4" style="margin-top: 8px;">
      <input
        class="form-control"
        bind:value={password}
        type="password"
        placeholder="密码, 不少于6位" />
    </div>
    <div class="col-8 offset-2 col-xl-4 offset-xl-4 row" style="margin-top: 8px;">
      <button class="btn btn-primary col-4" on:click={login}>登录</button>
      <button class="btn btn-info col-4 offset-4" on:click={checkRegist}>注册</button>
    </div>
  </div>
</div>

<Loading bind:show={loading_show} />
