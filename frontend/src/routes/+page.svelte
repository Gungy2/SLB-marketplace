<script lang="ts">
  import { currContract, stdlib } from "../store.js";
  import { Button, Heading } from "flowbite-svelte";
  import * as backend from "@backend";
  import { onMount } from "svelte";

  onMount(() => {
    console.log($currContract);
  });

  let count: number = 0;

  async function inc() {
    const account = await $stdlib.getDefaultAccount();
    count = await ctc(account).a.countUp();
  }

  const ctc = (acc: any) => acc.contract(backend, $currContract.getInfo());
</script>

<main>
  <Button on:click={inc}>Increment</Button>
  <Heading>Count is currently at {count}</Heading>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
