<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";
  import type { PageData } from "./$types.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";
  import { PUBLIC_STABLECOIN_ADDRESS } from "$env/static/public";
  import * as backend from "slbdexx/build/index.main.mjs";
  import { Contract } from "ethers";
  import { goto } from "$app/navigation";
  import { pb } from "$lib/pocketbaseClient.js";
  import slbContractJson from "contracts/artifacts/contracts/bond.sol/SLB_Bond.json";

  export let data: PageData;

  let slbAddress = data.bondAddress;
  let initialCoins = 1;
  let initialSLBs = 1;

  let error: AlertMessage | undefined = undefined;

  async function handleDeployment() {
    slbAddress = slbAddress.trim();
    if (!/^(?:0x)?[0-9a-fA-F]{40}$/i.test(slbAddress)) {
      error = {
        title: "Invalid Address",
        message: "Check if address of the SLB contract is correct!",
      };
      return;
    }
    const bond = await retrieveBond();

    if (bond?.exchange) {
      error = {
        title: "Exchange already deployed",
        message: "Find the bond in /bonds",
      };
      return;
    }

    let slbContract = new Contract(slbAddress, slbContractJson.abi, $currAccount.networkAccount);
    const exchangeAddress = await deployContract(slbContract);
    const newBondId = await updateOrCreateBond(bond?.id, slbContract, exchangeAddress);
    goto(`/bonds/${newBondId}`);
  }

  async function retrieveBondInfo(slbContract: Contract): Promise<Bond> {
    const [description, active_date, maturity_date, current_period, periods] = await Promise.all([
      slbContract.description(),
      // slbContract.kpis(),
      slbContract.activeDate(),
      slbContract.maturityDate(),
      slbContract.currentPeriod(),
      slbContract.periods(),
    ]);

    const bond: Bond = {
      address: slbContract.address,
      description,
      kpis: ["cool", "nice"],
      active_date: new Date(active_date.toNumber()),
      maturity_date: new Date(maturity_date.toNumber()),
      current_period: current_period.toNumber(),
      periods: periods.toNumber(),
    };
    return bond;
  }

  async function retrieveBond(): Promise<Record<string, any> | undefined> {
    try {
      return await pb.collection("bonds").getFirstListItem(`address="${slbAddress}"`);
    } catch {
      return undefined;
    }
  }

  async function updateOrCreateBond(
    bondId: string | undefined,
    slbContract: Contract,
    exchangeAddress: string
  ) {
    if (bondId) {
      await pb.collection("bonds").update(bondId, {
        exchange: exchangeAddress,
      });
      return bondId;
    }
    const bondInformation = { ...(await retrieveBondInfo(slbContract)), exchange: exchangeAddress };
    console.log(bondInformation);

    const createdBond = await pb.collection("bonds").create<Bond>(bondInformation);
    return createdBond.id;
  }

  async function deployContract(slbContract: Contract): Promise<string> {
    const exchange = $currAccount.contract(backend);

    await $stdlib.withDisconnect(() =>
      exchange.p.Creator({
        slbToken: slbAddress,
        slbContract: slbAddress,
        stableToken: PUBLIC_STABLECOIN_ADDRESS,
        startExchange: async function (contractAddress: string) {
          await slbContract.approve(contractAddress, initialSLBs);

          let abi = [
            "function approve(address _spender, uint256 _value) public returns (bool success)",
          ];
          const stableCoinContract = new Contract(
            PUBLIC_STABLECOIN_ADDRESS,
            abi,
            $currAccount.networkAccount
          );
          await stableCoinContract.approve(contractAddress, initialCoins);

          return {
            initSlbs: initialSLBs,
            initTokens: initialCoins,
          };
        },
        launched: $stdlib.disconnect,
      })
    );
    console.log("Exchange Deployed");
    return exchange.getInfo();
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
        <span class="text-xl ml-4 font-bold">Initial USDC</span>
        <input bind:value={initialCoins} type="number" min={1} class="input text-xl px-6 py-2" />
      </label>
      <label class="label mt-8">
        <span class="text-xl ml-4 font-bold">Initial SLBs</span>
        <input bind:value={initialSLBs} type="number" min={1} class="input text-xl px-6 py-2" />
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
  <Alert bind:alertMessage={error} type="error" />
</main>
