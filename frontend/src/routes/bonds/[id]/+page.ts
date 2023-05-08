import { pb } from '$lib/pocketbaseClient.js';
import type { PageLoad } from './$types.js';

export const load = (async ({ params }) => {
  const id = params.id;
  const bond = await pb.collection('bonds').getOne<Bond>(id);
  const exchange = await pb.collection('exchanges').getFirstListItem<Exchange>(`bond="${bond.id}"`, {
    expand: 'relField1,relField2.subRelField',
  });
  return { bond, exchange };
}) satisfies PageLoad;