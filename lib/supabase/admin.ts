import { createClient } from "@supabase/supabase-js";

export function assertSupabaseAdminConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server storage is not configured.");
  // Header values must be ASCII. This also catches secrets copied from a
  // dashboard while masked (for example, values containing bullet glyphs).
  if ([...key].some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 0x21 || codePoint > 0x7e;
  })) throw new Error("Server storage key is invalid. Replace the masked or malformed secret.");
  return { url, key };
}

export function createAdminClient() {
  const { url, key } = assertSupabaseAdminConfiguration();
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
