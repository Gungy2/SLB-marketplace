import { pb } from '$lib/pocketbaseClient.js';
import type { PageLoad } from './$types.js';

export const load = (async ({ params }) => {
  const id = params.id;
  const bond = await pb.collection('bonds').getOne(id);
  return { bond };
}) satisfies PageLoad;