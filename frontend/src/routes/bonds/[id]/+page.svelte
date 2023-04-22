<script lang="ts">
  import type { PageData } from "./$types.js";
  import InfoRow from "$lib/components/InfoRow.svelte";
  import { ProgressBar, type PopupSettings, popup } from "@skeletonlabs/skeleton";
  import { clipboard } from "@skeletonlabs/skeleton";
  import Alert, { type AlertMessage } from "$lib/components/Alert.svelte";

  export let data: PageData;

  let { bond } = data;
  $: ({ bond } = data);
  $: console.log(bond);

  let popupSettings: PopupSettings = {
    event: "hover",
    target: "periods",
    placement: "right",
  };

  let alertMessage: AlertMessage | undefined = undefined;

  function setAlertMessage() {
    alertMessage = { title: "Successfully copied address!", message: "" };
  }
</script>

<h1 class="mt-8 font-bold text-center">Sustainability Linked Bonds Exchange</h1>
<main class="grid grid-cols-2 gap-20 w-11/12 mx-auto my-10">
  <section class="card">
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
  <section class="card">HENLO2</section>
</main>
