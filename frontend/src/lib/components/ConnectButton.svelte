<script lang="ts">
  import { currAccount, stdlib } from "../store.js";
  import { ProgressRadial } from "@skeletonlabs/skeleton";

  let loading = false;
  async function connect() {
    loading = true;
    try {
      currAccount.set(await $stdlib.getDefaultAccount());
    } catch (err) {
      console.error(err);
    }
    loading = false;
  }
</script>

{#if $currAccount}
  <slot name="otherButton" {...$$restProps} />
{:else}
  <button {...$$restProps} on:click={connect} disabled={loading}>
    {#if loading}
      <span><ProgressRadial width="w-8" /></span>
    {:else}
      <span>Connect Wallet</span>
    {/if}
  </button>
{/if}
