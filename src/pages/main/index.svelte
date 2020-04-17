<script>
  import { push, pop, replace } from "svelte-spa-router";
  import Loading from "../../components/loading/index.svelte";
  import av from "../../utils/av.js";

  let user = AV.User.current();
  if (!user) {
    replace("/");
  }
  let loading_show = false,
    // 条目统计
    list = [],
    list_count_content = "",
    // 表单显示控制
    checked = false,
    // 是否为编辑
    is_edit = false,
    // 当前编辑的objectId
    edit_id = "",
    // 搜索框实例
    seach_input,
    // 表单字段
    username,
    phone,
    profession,
    remind,
    btn_modal_close;

  getList();

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
      list_count_content = `共${list.length}条`;
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

  function logout() {
    AV.User.logOut();
    replace("/");
  }

  function preAdd(item, idx) {
    is_edit = false;
    username = "";
    phone = "";
    profession = "";
    remind = "";
    edit_id = "";
  }

  async function add(item, idx) {
    is_edit = false;
    const body = {
      username: username,
      phone: phone,
      profession: profession,
      remind: remind,
      user
    };
    try {
      // 新增
      await av.create("Contact", body);
      checked = false;
      jQuery.toast({
        title: "新增成功",
        type: "success",
        delay: 1500
      });
      getList();
      btn_modal_close.click();
    } catch (error) {
      alert(error.rawMessage || error.message);
    }
  }

  function preEdit(item, idx) {
    is_edit = true;
    const json = item.toJSON();
    username = json.username;
    phone = json.phone;
    profession = json.profession;
    remind = json.remind;
    edit_id = json.objectId;
  }

  async function edit(item, idx) {
    const body = {
      username: username,
      phone: phone,
      profession: profession,
      remind: remind
    };
    try {
      await av.update("Contact", edit_id, body);
      checked = false;
      jQuery.toast({
        title: "更新成功",
        type: "success",
        delay: 1500
      });
      getList();
      btn_modal_close.click();
    } catch (error) {
      alert(error.rawMessage || error.message);
    }
  }

  async function del(item, idx) {
    if (confirm("确认删除吗?")) {
      loading_show = true;
      try {
        await av.delete("Contact", item.id);
        checked = false;
        list.splice(idx, 1);
        list = list;
      } catch (error) {
        alert(error.rawMessage || error.message);
      }
      loading_show = false;
    }
  }
</script>

<style>

</style>

<nav class="row">
  <button
    type="button"
    class="col-1 btn btn-primary"
    data-toggle="modal"
    data-target="#edit_modal"
    on:click={preAdd}>
    新增
  </button>
  <button
    class="col-1 btn btn-warning"
    style="margin-left: 8px;"
    on:click={logout}>
    退出
  </button>
  <span class="col-2 row justify-content-center align-items-center">
    {list_count_content}
  </span>
  <input
    class="col-2 form-control"
    placeholder="搜索"
    on:keypress={changeSearchInput}
    bind:this={seach_input} />
</nav>

<table class="table table-striped">
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
        <td>{item.get('username')}</td>
        <td>{item.get('phone')}</td>
        <td>{item.get('profession')}</td>
        <td>{item.get('remind')}</td>
        <td>
          <div class="btn-group">
            <button
              type="button"
              class="btn btn-primary"
              data-toggle="modal"
              data-target="#edit_modal"
              on:click={e => preEdit(item, idx)}>
              编辑
            </button>
            <button class="btn btn-danger" on:click={e => del(item, idx)}>
              删除
            </button>
          </div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<!-- 模态框 -->
<div class="modal fade" id="edit_modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h4 class="modal-title">{is_edit ? '编辑' : '新增'}</h4>
        <button type="button" class="close" data-dismiss="modal">
          &times;
        </button>
      </div>

      <!-- 模态框主体 -->
      <div class="modal-body row">
        <input
          class="form-control col-8 offset-2"
          style="margin-top: 8px;"
          bind:value={username}
          placeholder="姓名" />
        <input
          class="form-control col-8 offset-2"
          style="margin-top: 8px;"
          bind:value={phone}
          placeholder="号码" />
        <input
          class="form-control col-8 offset-2"
          style="margin-top: 8px;"
          bind:value={profession}
          placeholder="职业" />
        <input
          class="form-control col-8 offset-2"
          style="margin-top: 8px;"
          bind:value={remind}
          placeholder="备注" />
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary"
          on:click={is_edit ? edit : add}>
          确认
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          data-dismiss="modal"
          bind:this={btn_modal_close}>
          关闭
        </button>
      </div>
    </div>
  </div>
</div>

<Loading bind:show={loading_show} />
