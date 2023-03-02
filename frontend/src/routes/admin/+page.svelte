<script lang="ts">
  import * as backend from "@contract";
  import { onMount } from "svelte";
  import { stdlib, currContract } from "../../store.js";
  import { Button } from "flowbite-svelte";
  import { goto } from "$app/navigation";

  let ctcA: any;

  onMount(async () => {
    const account = await $stdlib.getDefaultAccount();
    $stdlib.fundFromFaucet(account, $stdlib.parseCurrency(10));
    ctcA = account.contract(backend);
  });

  async function startUp() {
    const flag = "startup incomplete";
    console.log("Starting up...");

    try {
      console.log("HERE");
      await ctcA.p.Admin({
        max: 5,
        launched: (c: any) => {
          throw flag;
        },
      });
      console.log("THERE");
    } catch (e) {
      if (e !== flag) throw e;
    }

    currContract.set(ctcA);
    console.log($currContract);
    console.log("Successful!");
    goto("/");
  }
</script>

<main>
  <Button on:click={startUp}>Deploy Contract</Button>
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
