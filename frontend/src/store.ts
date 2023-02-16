import { loadStdlib } from "@reach-sh/stdlib/browser";
import { readable, type Readable, type Subscriber } from "svelte/store";

export const stdlib: Readable<ReturnType<typeof loadStdlib>> = readable(
  undefined,
  (set: Subscriber<ReturnType<typeof loadStdlib>>) => {
    set(loadStdlib("ETH"));
  }
);
