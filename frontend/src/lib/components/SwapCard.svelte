<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import * as backend from "slbdexx/build/index.main.mjs";
  import { onMount } from "svelte";
  import Arrow from "$lib/images/next-arrow.svg?component";

  export let exchange: Exchange;

  let slbs: number = 1;
  let depositSlbs: number = 1;
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
    retailer = acc.contract(backend, exchange.address);
  });

  async function fetchPrice() {
    if (!retailer) {
      return;
    }
    price = $stdlib.bigNumberToNumber((await retailer.unsafeViews.Main.price()) ?? 0);
  }

  async function handleClick() {
    if (isBuying) {
      await retailer.apis.Retailer.buySLBs(slbs);
    } else {
      await retailer.apis.Retailer.sellSLBs(slbs);
    }
    await fetchPrice();
  }

  async function handleDeposit() {
    await retailer.apis.Retailer.deposit(depositSlbs);
    await fetchPrice();
  }

  async function handleWithdrawal() {
    await retailer.apis.Retailer.withdraw();
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
    <button on:click|preventDefault={() => (isBuying = !isBuying)}>
      <Arrow class={`w-20 h-auto mt-4 mb-2 transition-all ${arrowStyles(isBuying)}`} />
    </button>
    <label class="label w-full">
      <span class="text-xl ml-4 font-bold">Approx. USDC</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">USDC</div>
        <input value={(price ?? 0) * slbs} type="number" readonly class="transition-all" />
      </div>
    </label>
    <ConnectButton class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6">
      <button slot="otherButton" let:class={className} class={className} on:click={handleClick}>
        Swap
      </button>
    </ConnectButton>
  </form>
  <h2 class="ml-8 m-4 font-bold">Deposit or Withdraw</h2>
  <form class="flex flex-col p-4 items-center" action="">
    <label class="label w-full">
      <span class="text-xl ml-4 font-bold">SLBs</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">SLBs</div>
        <input bind:value={depositSlbs} type="number" min={1} />
      </div>
    </label>
    <div class="grid grid-cols-2 w-11/12 gap-10">
      <button
        class="btn text-2xl my-6 font-bold variant-filled-primary"
        on:click={handleDeposit}
        disabled={!$currAccount}
      >
        Deposit
      </button>
      <button
        class="btn text-2xl my-6 font-bold variant-filled-error"
        on:click={handleWithdrawal}
        disabled={!$currAccount}
      >
        Withdraw All
      </button>
    </div>
  </form>
</div>
