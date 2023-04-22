import type { PageLoad } from './$types.js';
import { pb } from "$lib/pocketbaseClient.js";

export const load = (async () => {
  const bonds = await pb.collection("bonds").getFullList({
    sort: '-created',
  });
  return {
    bonds: bonds ?? [],
  };
}) satisfies PageLoad;