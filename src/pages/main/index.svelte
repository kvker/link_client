<script>
  import { push, pop, replace } from "svelte-spa-router";
  import Loading from "../../components/loading/index.svelte";
  import av from "../../utils/av.js";

  let user = AV.User.current();
  if (!user) {
    replace("/");
  }
  let loading_show = false;
  // 条目统计
  let textContent = "";
  let list = [];

  let checked = false;

  // 新增表单
  let username;
  let phone;
  let profession;
  let remind;

  getList();

  /**
   * 获取列表
   * @param {number} page 页码
   */
  async function getList(search_value = "") {
    loading_show = true;
    try {
      list = (await av.read("Contact", q => {
        q.equalTo("user", user);
        if (search_value) {
          q.contains("username", search_value);
        }
        q.limit(1000);
      })).sort((a, b) =>
        a.get("username").localeCompare(b.get("username"), "zh-Hans-CN", {
          sensitivity: "accent"
        })
      );
      textContent = `共${list.length}条`;
    } catch (error) {
      alert(error.rawMessage || error.message);
    }
    loading_show = false;
  }

  function changeSearchInput(e) {
    if (e.keyCode === 13) {
      // 回车
      getList(e.target.value);
    }
  }

  async function confirmAdd() {
    if (!username || !phone || !profession || !remind) {
      alert("请输入全部内容");
      return;
    }
    // this.toggleModal("#modal_add");
    const body = {
      username: username,
      phone: phone,
      profession: profession,
      remind: remind,
      user
    };
    loading_show = true;
    try {
      await av.create("Contact", body);
      checked = false;
      alert("新增成功");
      list = [body, ...list];
    } catch (error) {
      alert(error.rawMessage || error.message);
    }
    loading_show = false;
    cleanAddForm();
  }

  function cleanAddForm() {
    username = "";
    phone = "";
    profession = "";
    remind = "";
  }

  function logout() {
    AV.User.logOut();
    replace("/");
  }

  function edit(item, idx) {
    console.log(item, idx);
  }

  async function del(item, idx) {
    console.log(item, idx);
    loading_show = true;
    try {
      await av.delete("Contact", item.id);
      checked = false;
      // list = [body, ...list];
      list.splice(idx, 1)
      list = list
    } catch (error) {
      alert(error.rawMessage || error.message);
    }
    loading_show = false;
  }
</script>

<style>
  nav {
    position: sticky;
    width: 100%;
  }

  .modal .content .half {
    margin: 8px;
  }

  table {
    width: 100%;
  }

  .error {
    margin-left: 16px;
  }
</style>

<nav>
  <label for="modal_add" class="button">新增</label>
  <button class="warning" on:click={logout}>退出</button>
  <span id="list_count" style="margin-left: 100px;" />
  <div class="menu">
    <input placeholder="搜索" on:keypress={changeSearchInput} />
  </div>
</nav>

<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>号码</th>
      <th>职业</th>
      <th>备注</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody id="tbody">
    {#each list as item, idx (idx)}
      <tr>
        <td>{item.get ? item.get('username') : item.username}</td>
        <td>{item.get ? item.get('phone') : item.phone}</td>
        <td>{item.get ? item.get('profession') : item.profession}</td>
        <td>{item.get ? item.get('remind') : item.remind}</td>
        <td>
          <button class="small_btn" on:click={e => edit(item, idx)}>
            编辑
          </button>
          <button class="small_btn error" on:click={e => del(item, idx)}>
            删除
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<div class="modal">
  <input id="modal_add" type="checkbox" bind:checked />
  <label for="modal_add" class="overlay" />
  <article>
    <header>
      <h3>新增</h3>
      <label for="modal_add" class="close">&times;</label>
    </header>
    <section class="content flex one center">
      <input
        bind:value={username}
        class="half"
        type="text"
        placeholder="姓名" />
      <input
        bind:value={phone}
        class="half center"
        type="text"
        placeholder="号码" />
      <input
        bind:value={profession}
        class="half"
        type="text"
        placeholder="职业" />
      <input bind:value={remind} class="half" type="text" placeholder="备注" />
    </section>
    <footer>
      <label class="button" on:click={confirmAdd}>确定</label>
      <label for="modal_add" class="button dangerous">取消</label>
    </footer>
  </article>
</div>

<Loading bind:show={loading_show} />
