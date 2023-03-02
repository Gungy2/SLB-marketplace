import MyAlgoConnect from "@randlabs/myalgo-connect";
import { get } from "svelte/store";
import { stdlib } from "./store.js";

get(stdlib).setWalletFallback(
  get(stdlib).walletFallback({
    providerEnv: "LocalHost",
    MyAlgoConnect,
  })
);
