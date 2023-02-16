<script lang="ts">
  import { stdlib } from "../store.js";
  import { Button, Heading } from "flowbite-svelte";

  let account: any;
  let balance: any;

  async function connect() {
    account = await $stdlib!!.getDefaultAccount();
    await $stdlib!!.fundFromFaucet(account, $stdlib!!.parseCurrency(10));
  }

  $: if (account) {
    $stdlib!!.balanceOf(account).then((bal) => (balance = bal));
  }
</script>

<main>
  <Button on:click={connect}>Connect</Button>
  {#if balance}
    <Heading>The account has {balance}</Heading>
  {/if}
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
