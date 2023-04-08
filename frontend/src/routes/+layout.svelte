<script lang="ts">
  import { onMount } from "svelte";
  import "../app.postcss";
  import { currAccount } from "../store.js";

  onMount(async () => {
    const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      currAccount.set(accounts[0]);
    }
  });
</script>

<slot />
