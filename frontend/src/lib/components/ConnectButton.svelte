<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { currAccount, stdlib } from "../../store.js";

  async function connect() {
    currAccount.set(await $stdlib.getDefaultAccount());
  }
</script>

{#if $currAccount}
  <slot />
{:else}
  <Button on:click={connect}>Connect</Button>
{/if}
