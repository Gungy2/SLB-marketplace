import { pb } from '$lib/pocketbaseClient.js';
import type { PageLoad } from './$types.js';

export const load = (async ({ params }) => {
  const id = params.id;
  const bond = await pb.collection('bonds').getOne<Bond>(id);
  let ammExchange: Exchange | undefined;
  try {
    ammExchange = await pb.collection('exchanges').getFirstListItem<Exchange>(`bond="${bond.id}" && amm=True`, {
      expand: 'bond,stable_coin',
    });
  } catch (err) {
  }
  let traditionalExchange: Exchange | undefined;
  try {
    traditionalExchange = await pb.collection('exchanges').getFirstListItem<Exchange>(`bond="${bond.id}" && amm=False`, {
      expand: 'bond,stable_coin',
    });
  } catch (err) {
  }
  return { bond, ammExchange, traditionalExchange };
}) satisfies PageLoad;