import type { PageLoad } from './$types.js';
import { supabase } from "$lib/supabaseClient.js";

export const load = (async () => {
  const { data } = await supabase.from("exchanges").select();
  return {
    exchanges: data ?? [],
  };
}) satisfies PageLoad;