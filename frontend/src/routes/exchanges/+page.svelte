<script lang="ts">
  import type { PageData } from "./$types.js";
  import { Paginator, Table, tableMapperValues } from "@skeletonlabs/skeleton";

  export let data: PageData;
  let { exchanges } = data;
  $: ({ exchanges } = data);

  const tableHeaders = Object.keys(exchanges[0]);

  let page = {
    offset: 0,
    limit: 5,
    size: exchanges.length,
    amounts: [1, 2, 5, 10],
  };

  $: paginatedExchanges = exchanges.slice(
    page.offset * page.limit, // start
    page.offset * page.limit + page.limit // end
  );

  $: tableSource = {
    head: Object.keys(exchanges[0]),
    body: tableMapperValues(paginatedExchanges, tableHeaders),
    meta: tableMapperValues(paginatedExchanges, ["id"]),
  };

  function onSelected(selectEvent: CustomEvent<[number]>) {
    console.log(selectEvent.detail[0]);
  }
</script>

<main class="w-10/12 mx-auto mt-10">
  <h1 class="text-center">Exchanges</h1>
  <Table interactive class="mt-10" source={tableSource} on:selected={onSelected} />
  <Paginator class="mt-10" bind:settings={page} />
</main>
