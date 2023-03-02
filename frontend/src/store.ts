import { loadStdlib } from "@reach-sh/stdlib/browser";
import { readable, writable, type Readable, type Subscriber, type Writable } from "svelte/store";
import { PUBLIC_PLATFORM } from "$env/static/public";

export const stdlib: Readable<ReturnType<typeof loadStdlib>> = readable(
  undefined,
  (set: Subscriber<ReturnType<typeof loadStdlib>>) => {
    set(loadStdlib(PUBLIC_PLATFORM));
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const currContract: Writable<any> = writable(undefined);
