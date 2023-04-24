<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import * as backend from "$lib/contracts/index.main.mjs";
  import { onMount } from "svelte";
  import Arrow from "$lib/images/next-arrow.svg?component";

  export let address: string;

  let slbs: number = 1;
  let isBuying = true;
  let price: number;

  let retailer: any;

  onMount(async () => {
    const interval = setInterval(async () => {
      await fetchPrice();
    }, 2000);
    await fetchPrice();
    return () => clearInterval(interval);
  });

  currAccount.subscribe((acc) => {
    if (!acc) {
      return;
    }
    retailer = acc.contract(backend, address);
  });

  async function fetchPrice() {
    if (!retailer) {
      return;
    }
    price = $stdlib.bigNumberToNumber((await retailer.v.Main.price())[1] ?? 0);
  }

  async function handleClick() {
    console.log(await retailer.apis.Retailer.customGetBalance());
    if (isBuying) {
      await retailer.apis.Retailer.buySLBs(slbs);
    } else {
      await retailer.apis.Retailer.sellSLBs(slbs);
    }
    await fetchPrice();
  }

  function arrowStyles(isBuying: boolean) {
    if (isBuying) {
      return "-rotate-90 fill-success-500";
    }
    return "rotate-90 fill-error-500";
  }
</script>

<div class="card border-black border shadow-2xl">
  <h2 class="card-header m-4 font-bold">Swap</h2>
  <form class="flex flex-col p-4 items-center" action="">
    <label class="label w-full">
      <span class="text-xl ml-4 font-bold">SLBs</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">SLBs</div>
        <input bind:value={slbs} type="number" min={1} />
      </div>
    </label>
    <button on:click={() => (isBuying = !isBuying)}>
      <Arrow class={`w-20 h-auto mt-4 mb-2 transition-all ${arrowStyles(isBuying)}`} />
    </button>
    <label class="label w-full">
      <span class="text-xl ml-4 font-bold">Approx. ETH</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">WEI</div>
        <input value={(price ?? 0) * slbs} type="number" readonly class="transition-all" />
      </div>
    </label>
    <ConnectButton class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6">
      <button slot="otherButton" let:class={className} class={className} on:click={handleClick}>
        Swap
      </button>
    </ConnectButton>
  </form>
</div>
