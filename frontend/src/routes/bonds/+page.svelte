<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types.js";
  import { Paginator, Table, tableMapperValues } from "@skeletonlabs/skeleton";

  export let data: PageData;
  let { bonds } = data;
  $: ({ bonds } = data);

  const tableHeaders = ["description", "kpis", "active_date", "maturity_date"];

  let page = {
    offset: 0,
    limit: 5,
    size: bonds.length,
    amounts: [1, 2, 5, 10],
  };

  $: paginatedExchanges = bonds.slice(
    page.offset * page.limit, // start
    page.offset * page.limit + page.limit // end
  );

  $: tableSource = {
    head: tableHeaders,
    body: tableMapperValues(paginatedExchanges, tableHeaders),
    meta: tableMapperValues(paginatedExchanges, ["id"]),
  };

  function onSelected(selectEvent: CustomEvent<[number]>) {
    const bondId = selectEvent.detail[0];
    goto(`/bonds/${bondId}`);
  }
</script>

<main class="w-10/12 mx-auto mt-10">
  <h1 class="text-center">Sustainability Linked Bonds</h1>
  <Table interactive class="mt-10" source={tableSource} on:selected={onSelected} />
  <Paginator class="mt-10" bind:settings={page} />
</main>
