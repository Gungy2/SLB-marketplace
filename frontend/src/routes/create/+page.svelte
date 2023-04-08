<script lang="ts">
  import { currAccount, stdlib } from "../../store.js";

  import ConnectButton from "../../lib/components/ConnectButton.svelte";
</script>

<ConnectButton>
  {#await $stdlib.balanceOf($currAccount)}
    <p>...waiting</p>
  {:then balance}
    <p>Bonjour, {balance}!</p>
  {/await}
</ConnectButton>
