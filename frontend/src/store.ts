import { loadStdlib } from "@reach-sh/stdlib/browser";
import { readable, writable, type Readable, type Subscriber, type Writable } from "svelte/store";
import { PUBLIC_PLATFORM } from "$env/static/public";
import { ethers } from 'ethers';

export const stdlib: Readable<ReturnType<typeof loadStdlib>> = readable(
  undefined,
  (set: Subscriber<ReturnType<typeof loadStdlib>>) => {
    const reach: any = loadStdlib(PUBLIC_PLATFORM);
    set(reach);
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const currContract: Writable<any> = writable(undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const currAccount: Writable<any> = writable(undefined);
