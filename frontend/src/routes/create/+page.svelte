<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";
  import * as backend from "$lib/contracts/index.main.mjs";
  import { ethers } from "ethers";

  let slbAddress = "";
  let initialWei = 1;
  let initialSLBs = 1;

  let error: AlertMessage | undefined = undefined;

  async function handleDeployment() {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(slbAddress)) {
      error = {
        title: "Invalid Address",
        message: "Check if address of the SLB contract is correct!",
      };
      return;
    }
    await deployContract();
  }

  async function approveSLBs(contractAddress: string, amount: number) {
    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];

    let contract = new ethers.Contract(slbAddress, abi, $currAccount.networkAccount);
    await contract.approve(contractAddress, amount);
  }

  async function deployContract() {
    const exchange = $currAccount.contract(backend);

    await $stdlib.withDisconnect(() =>
      exchange.p.Creator({
        slbToken: slbAddress,
        slbContract: slbAddress,
        startExchange: async function (contractAddress: string) {
          await approveSLBs(contractAddress, initialSLBs);
          // console.log(
          //   `Allowance: ${await creatorToken.allowance(
          //     accCreator.getAddress(),
          //     contract
          //   )}`
          // );
          return {
            initSlbs: initialSLBs,
            initTokens: initialWei,
          };
        },
        launched: $stdlib.disconnect,
      })
    );
    console.log("CONTRACT DEPLOYED");
  }
</script>

<main>
  <div class="card mt-20 w-1/3 m-auto variant-filled-surface border-black border shadow-2xl">
    <h2 class="card-header m-4 font-bold">Deploy DEX Contract</h2>
    <form class="flex flex-col p-4" action="">
      <label class="label">
        <span class="text-xl ml-4 font-bold">SLB Contract Address</span>
        <input bind:value={slbAddress} class="input text-xl px-6 py-2" />
      </label>
      <label class="label mt-8">
        <span class="text-xl ml-4 font-bold">Initial Wei</span>
        <input bind:value={initialWei} type="number" min={1} class="input text-xl px-6 py-2" />
      </label>
      <label class="label mt-8">
        <span class="text-xl ml-4 font-bold">Initial SLBs</span>
        <input value={initialSLBs} type="number" min={1} class="input text-xl px-6 py-2" />
      </label>
      <ConnectButton class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6">
        <button
          slot="otherButton"
          let:class={className}
          class={className}
          on:click={handleDeployment}
        >
          Deploy Contract
        </button>
      </ConnectButton>
    </form>
  </div>
  <Alert alertMessage={error} type="error" />
</main>
