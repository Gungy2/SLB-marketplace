<script lang="ts">
  // Your selected Skeleton theme:
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";

  // This contains the bulk of Skeletons required styles:
  import "@skeletonlabs/skeleton/styles/all.css";

  import { onMount } from "svelte";
  import "../app.postcss";
  import { currAccount, stdlib } from "$lib/store.js";
  import { AppBar } from "@skeletonlabs/skeleton";
  import ConnectButton from "$lib/components/ConnectButton.svelte";
  import logo from "$lib/images/logo.png";
  import Home from "svelte-material-icons/Home.svelte";

  onMount(async () => {
    const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      currAccount.set(await $stdlib.getDefaultAccount());
    }
  });

  const HomeButton = Home as any;
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <a href="/" class="inline-block mb-1"><HomeButton size="3rem" /></a></svelte:fragment
  >
  <a href="/" class="inline-block ml-2">
    <img alt="SLB DEX Logo" src={logo} class="object-cover h-10" />
  </a>
  <svelte:fragment slot="trail">
    <ConnectButton class="btn text-lg variant-filled-primary w-11/12 m-auto" />
  </svelte:fragment>
</AppBar>

<slot />
