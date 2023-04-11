<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";

  import ConnectButton from "$lib/components/ConnectButton.svelte";

  let slbs: number = 0;
</script>

<main>
  <div class="card mt-20 w-1/3 m-auto variant-filled-surface border-black border shadow-2xl">
    <h2 class="card-header m-4 font-bold">Swap</h2>
    <form class="flex flex-col p-4" action="">
      <label class="label">
        <span class="text-xl ml-4 font-bold">SLBs</span>
        <input bind:value={slbs} type="number" class="input text-xl px-6 py-2" />
      </label>
      <label class="label mt-8">
        <span class="text-xl ml-4 font-bold">ETH</span>
        <input value={slbs} type="number" class="input text-xl px-6 py-2" readonly />
      </label>
      <ConnectButton class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6">
        <button slot="otherButton" let:class={className} class={className}>Swap</button>
      </ConnectButton>
    </form>
  </div>
</main>
