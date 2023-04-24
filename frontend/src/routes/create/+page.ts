import type { PageLoad } from './$types.js';
export const load = (async ({ url }) => {
  const bondAddress = url.searchParams.get('address') ?? "";
  return { bondAddress };
}) satisfies PageLoad;