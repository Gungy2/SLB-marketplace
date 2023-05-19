<script lang="ts">
  import { currAccount, stdlib } from "$lib/store.js";
  import type { PageData } from "./$types.js";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";
  import * as backend from "slbdexx/build/index.main.mjs";
  import { Contract, ContractFactory, ethers } from "ethers";
  import { goto } from "$app/navigation";
  import { pb } from "$lib/pocketbaseClient.js";
  import slbContractJson from "contracts/artifacts/contracts/SLB_Bond.sol/SLB_Bond.json";
  import traditionalExchangeJson from "contracts/artifacts/contracts/OrderBook.sol/OrderBook.json";
  import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

  const ADDRESS_REGEX = /^(?:0x)?[0-9a-fA-F]{40}$/i;
  export let data: PageData;

  let slbAddress = data.bondAddress;
  let initialCoins = 1;
  let initialSLBs = 1;
  let selectedStablecoinId: string;
  let exchangeType: "decentralized" | "traditional" = "decentralized";

  let error: AlertMessage | undefined = undefined;

  async function handleDeployment() {
    try {
      slbAddress = slbAddress.trim();
      if (!ADDRESS_REGEX.test(slbAddress)) {
        error = {
          title: "Invalid Address",
          message: "Check if address of the SLB contract is correct!",
        };
        return;
      }
      const bond = await retrieveBond();
      if (bond) {
        const existingExchange = await pb
          .collection("exchanges")
          .getFirstListItem<Exchange>(`bond="${bond.id}" && stable_coin="${selectedStablecoinId}"`);
        if (existingExchange) {
          error = {
            title: "Exchange already exists",
            message:
              "The exchange with the specific combination of the bond and the stable coin already exists!",
          };
          return;
        }
      }

      let slbContract = new Contract(slbAddress, slbContractJson.abi, $currAccount.networkAccount);
      const exchangeAddress = await (exchangeType == "decentralized"
        ? deployDecentralizedExchangeContract(slbContract)
        : deployTraditionalExchangeContract());
      const newBondId = bond?.id ?? (await createBondRecord(slbContract));
      await createExchangeRecord(
        exchangeAddress,
        newBondId,
        selectedStablecoinId,
        exchangeType == "decentralized"
      );
      goto(`/bonds/${newBondId}`);
    } catch (e) {
      console.error(e);

      error = {
        title: "Something went wrong!",
        message: "Please try again after refreshing the page!",
      };
      return;
    }
  }

  async function createExchangeRecord(
    address: string,
    bondId: string,
    stableCoinId: string,
    amm: boolean
  ) {
    const data = {
      address,
      bond: bondId,
      stable_coin: stableCoinId,
      amm,
    };

    await pb.collection("exchanges").create<Exchange>(data);
  }

  async function retrieveBondInfo(slbContract: Contract): Promise<Bond> {
    const [description, kpis, active_date, maturity_date, current_period, periods] =
      await Promise.all([
        slbContract.description(),
        slbContract.getKPIs(),
        slbContract.activeDate(),
        slbContract.maturityDate(),
        slbContract.currentPeriod(),
        slbContract.periods(),
      ]);

    const bond: Bond = {
      address: slbContract.address,
      description,
      kpis: transformKPIs(kpis),
      active_date: new Date(active_date.toNumber()),
      maturity_date: new Date(maturity_date.toNumber()),
      current_period: current_period.toNumber(),
      periods: periods.toNumber(),
    };
    return bond;
  }

  function transformKPIs(kpis: number[]) {
    const KPI_MAP = ["NONE", "GHG", "RECYCLED", "SOCIAL"];
    return kpis.map((index) => KPI_MAP[index]);
  }

  async function retrieveBond() {
    try {
      return await pb.collection("bonds").getFirstListItem<Bond>(`address="${slbAddress}"`);
    } catch {
      return undefined;
    }
  }

  async function createBondRecord(slbContract: Contract) {
    const bondInformation = await retrieveBondInfo(slbContract);
    console.log(bondInformation);

    const createdBond = await pb.collection("bonds").create<Bond>(bondInformation);
    return createdBond.id!;
  }

  async function deployDecentralizedExchangeContract(slbContract: Contract): Promise<string> {
    const exchange = $currAccount.contract(backend);
    const stableCoin = data.stableCoins.find((coin) => coin.id == selectedStablecoinId)!!;

    await $stdlib.withDisconnect(() =>
      exchange.p.Creator({
        slbToken: slbAddress,
        slbContract: slbAddress,
        stableToken: stableCoin.address,
        startExchange: async function (contractAddress: string) {
          await slbContract.approve(contractAddress, initialSLBs);

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

  async function deployTraditionalExchangeContract(): Promise<string> {
    const stableCoin = data.stableCoins.find((coin) => coin.id == selectedStablecoinId)!!;

    const contractFactory = new ContractFactory(
      traditionalExchangeJson.abi,
      traditionalExchangeJson.bytecode,
      $currAccount.networkAccount
    );
    const exchange = await contractFactory.deploy(slbAddress, stableCoin.address);
    return exchange.address;
  }
</script>

<main>
  <div class="card mt-20 w-1/3 m-auto variant-filled-surface border-black border shadow-2xl">
    <h2 class="card-header m-4 font-bold">Deploy DEX Contract</h2>
    <form class="flex flex-col p-4" action="">
      <label class="label">
        <span class="text-xl ml-2 font-bold">SLB Contract Address</span>
        <input bind:value={slbAddress} class="input text-xl px-6 py-2" />
      </label>
      <RadioGroup class="text-xl mt-10 justify-evenly">
        <RadioItem bind:group={exchangeType} name="justify" value="decentralized"
          >Decentralized Exchange</RadioItem
        >
        <RadioItem bind:group={exchangeType} name="justify" value="traditional"
          >Traditional Exchange</RadioItem
        >
      </RadioGroup>
      <label class="label mt-8">
        <span class="text-xl ml-2 font-bold">Stable Coin Used</span>

        <select bind:value={selectedStablecoinId} class="select">
          {#each data.stableCoins as stableCoin}
            <option value={stableCoin.id}>{stableCoin.symbol} ({stableCoin.name})</option>
          {/each}
        </select>
      </label>

      {#if exchangeType == "decentralized"}
        <label class="label mt-8">
          <span class="text-xl ml-2 font-bold">Initial SLBs</span>
          <input bind:value={initialSLBs} type="number" min={1} class="input text-xl px-6 py-2" />
        </label>
        <label class="label mt-8">
          <span class="text-xl ml-2 font-bold">Initial Coins</span>
          <input bind:value={initialCoins} type="number" min={1} class="input text-xl px-6 py-2" />
        </label>
      {/if}
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
