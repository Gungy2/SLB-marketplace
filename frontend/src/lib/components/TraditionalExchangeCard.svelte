<script lang="ts">
  import { currAccount } from "$lib/store.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import exchangeJson from "contracts/artifacts/contracts/OrderBook.sol/OrderBook.json";
  import { Contract } from "ethers";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";
  import { onMount } from "svelte";

  export let exchange: Exchange;
  const exchangeContract = new Contract(
    exchange.address,
    exchangeJson.abi,
    $currAccount.networkAccount
  );

  let isBuying = true;
  let price: number = 1;
  let amount: number = 1;

  onMount(async () => {
    const interval = setInterval(async () => {
      await fetchPrices();
    }, 2000);
    await fetchPrices();
    return () => clearInterval(interval);
  });

  let maxBuyPrice: number;
  let minSellPrice: number;

  async function fetchPrices() {
    maxBuyPrice = (await exchangeContract.maxBuyPrice()).toNumber();
    minSellPrice = (await exchangeContract.minSellPrice()).toNumber();
    console.log(maxBuyPrice, minSellPrice);
  }

  async function sendOrder() {
    try {
      if (isBuying) {
        await approveTokens(exchange.expand.stable_coin.address, amount);
        await exchangeContract.placeBuyOrder(price, amount);
      } else {
        await approveTokens(exchange.expand.bond.address, amount);
        await exchangeContract.placeSellOrder(price, amount);
      }
      alertMessage = { title: "Success", message: "Order successfully placed!" };
      await fetchPrices();
    } catch (err) {
      console.error(err);
      alertMessage = { title: "Failure", message: "Something went wrong!" };
    }
  }

  async function approveTokens(address: string, amount: number) {
    const abi = [
      "function approve(address _spender, uint256 _value) public returns (bool success)",
    ];
    const contract = new Contract(address, abi, $currAccount.networkAccount);
    await contract.approve(exchange.address, amount);
  }

  let alertMessage: AlertMessage | undefined = undefined;
</script>

<div class="card border-black border shadow-2xl">
  <h2 class="card-header m-4 font-bold">Trade</h2>
  <h3 class="mx-6 font-bold my-2">Best ask: {minSellPrice} USDC</h3>
  <h3 class="mx-6 font-bold my-2">Best bid: {maxBuyPrice} USDC</h3>

  <form class="flex flex-col p-4 items-center" action="">
    <label class="label w-full">
      <span class="text-xl ml-4 font-bold">Amount of SLBs</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">SLBs</div>
        <input bind:value={amount} type="number" min={1} />
      </div>
    </label>
    <label class="label mt-6 w-full">
      <span class="text-xl ml-4 font-bold">Price in USDC</span>
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">USDC</div>
        <input bind:value={price} type="number" class="transition-all" min={1} />
      </div>
    </label>
    <div class="mt-6 w-full flex">
      <span class="text-xl ml-4 font-bold">Buy Order</span>
      <SlideToggle name="slide" class="ml-10" bind:checked={isBuying} />
    </div>

    <ConnectButton class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6">
      <button slot="otherButton" let:class={className} class={className} on:click={sendOrder}>
        Send {isBuying ? "Buy" : "Sell"} Order
      </button>
    </ConnectButton>
  </form>
  <Alert type="success" variant="filled" bind:alertMessage />
</div>
