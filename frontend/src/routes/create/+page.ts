import { pb } from '$lib/pocketbaseClient.js';
import type { PageLoad } from './$types.js';
export const load = (async ({ url }) => {
  const bondAddress = url.searchParams.get('address') ?? "";
  const stableCoins = await pb.collection('stable_coins').getFullList<StableCoin>({
    sort: '-created',
  });
  return { bondAddress, stableCoins };
}) satisfies PageLoad;