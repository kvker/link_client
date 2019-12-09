<script>
  import { onMount } from "svelte";
  import Router, { push } from "svelte-spa-router";
  import LoginPage from "./pages/login/index.svelte";
  import MainPage from "./pages/main/index.svelte";
  import NotFound from "./pages/not_found/index.svelte";

  const routes = {
    "/": LoginPage,
    "/main": MainPage,
    "*": NotFound
  };

  onMount(() => {
    if(AV.User.current()) {
      push('/main')
    }
  })
</script>

<Router {routes} />
