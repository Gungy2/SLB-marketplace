<script lang="ts">
  import type { PageData } from "./$types.js";
  import InfoRow from "$lib/components/InfoRow.svelte";
  import SwapCard from "$lib/components/SwapCard.svelte";
  import { ProgressBar, type PopupSettings, popup, TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { clipboard } from "@skeletonlabs/skeleton";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";
  import TraditionalExchangeCard from "$lib/components/TraditionalExchangeCard.svelte";

  export let data: PageData;

  let { bond } = data;
  $: ({ bond } = data);

  let popupSettings: PopupSettings = {
    event: "hover",
    target: "periods",
    placement: "right",
  };

  let alertMessage: AlertMessage | undefined = undefined;
  let tabSet: number = 0;

  function setAlertMessage() {
    alertMessage = { title: "Successfully copied address!", message: "" };
  }
</script>

<svelte:head><title>{bond.description}</title></svelte:head>
<h1 class="mt-8 font-bold text-center">Sustainability Linked Bonds Exchange</h1>
<main class="grid grid-cols-2 gap-20 w-11/12 mx-auto my-10">
  <section class="card border-black border shadow-2xl">
    <h2 class="card-header font-bold pl-10">SLB Information</h2>
    <table class="w-11/12 table-fixed my-4 text-xl mx-auto">
      <InfoRow title="Description">
        <p class="!text-xl">{bond.description}</p>
      </InfoRow>
      <InfoRow title="KPIs">
        <p class="!text-xl">{bond.kpis}</p>
      </InfoRow>
      <InfoRow title="Active Date">
        <p class="!text-xl">{new Date(bond.active_date).toLocaleString()}</p>
      </InfoRow>
      <InfoRow title="Maturity Date">
        <p class="!text-xl">{new Date(bond.maturity_date).toLocaleString()}</p>
      </InfoRow>
      <InfoRow title="Period">
        <div class="w-3/4" use:popup={popupSettings}>
          <ProgressBar label="Progress Bar" value={bond.current_period} max={bond.periods} />
        </div>
        <div class="px-4" data-popup="periods">{bond.current_period} / {bond.periods}</div>
      </InfoRow>
      <InfoRow title="Address">
        <p
          use:clipboard={bond.address}
          on:keyup={setAlertMessage}
          on:click={setAlertMessage}
          class="!text-xl cursor-pointer"
        >
          {bond.address}
        </p>
        <Alert type="warning" variant="ghost" bind:alertMessage />
      </InfoRow>
    </table>
  </section>
  <TabGroup justify="justify-left">
    <Tab bind:group={tabSet} name="AMM Exchange" value={0}>AMM Exchange</Tab>
    <Tab bind:group={tabSet} name="Traditional Exchange" value={1}>Traditional Exchange</Tab>
    <svelte:fragment slot="panel">
      {#if tabSet === 0}
        {#if data.ammExchange}
          <SwapCard exchange={data.ammExchange} />
        {:else}
          <a
            href={`/create?address=${bond.address}`}
            class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6"
          >
            Deploy AMM Exchange
          </a>
        {/if}
      {:else if tabSet === 1}
        {#if data.traditionalExchange}
          <TraditionalExchangeCard exchange={data.traditionalExchange} />
        {:else}
          <a
            href={`/create?address=${bond.address}`}
            class="btn text-2xl font-bold variant-filled-primary w-11/12 m-auto my-6"
          >
            Deploy Traditional Exchange
          </a>
        {/if}
      {/if}
    </svelte:fragment>
  </TabGroup>
</main>
