import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; if (!url || !key) throw new Error("Authentication is not configured."); const store = await cookies(); return createServerClient(url, key, { cookies: { getAll: () => store.getAll(), setAll: items => { try { items.forEach(item => store.set(item.name, item.value, item.options)); } catch { /* Server Components cannot write cookies. */ } } } }); }
