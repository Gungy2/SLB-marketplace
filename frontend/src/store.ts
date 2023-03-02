import { loadStdlib } from "@reach-sh/stdlib/browser";
import { readable, writable, type Readable, type Subscriber, type Writable } from "svelte/store";

export const stdlib: Readable<ReturnType<typeof loadStdlib>> = readable(
  undefined,
  (set: Subscriber<ReturnType<typeof loadStdlib>>) => {
    set(loadStdlib(import.meta.env.PLATFORM));
  }
);

export const currContract: Writable<any> = writable(undefined);