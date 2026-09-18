import { lookup } from "node:dns/promises";
import { createClient } from "@/lib/supabase/server";
import { fieldQuestions } from "@/lib/cookbook-session";

export const runtime = "nodejs";
export const maxDuration = 60;

const requests = new Map<string, number[]>();
const isPrivateAddress = (address: string) => /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(address) || address === "::1" || /^f[cd]/i.test(address) || /^fe80:/i.test(address);
const isSafeUrl = async (value: string) => { const url = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`); if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("Enter a public http(s) website URL."); const addresses = await lookup(url.hostname, { all: true }); if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("That URL is not a public website."); return url; };
const readHtml = async (initial: URL) => { let url = initial; for (let attempt = 0; attempt < 3; attempt += 1) { const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Cookbook-intake/1.0" }, signal: AbortSignal.timeout(10_000) }); if ([301, 302, 303, 307, 308].includes(response.status)) { const location = response.headers.get("location"); if (!location) throw new Error("The website redirected without a destination."); url = await isSafeUrl(new URL(location, url).toString()); continue; } if (!response.ok) throw new Error("The website could not be reached."); if (!response.headers.get("content-type")?.includes("text/html")) throw new Error("That URL did not return a website page."); const reader = response.body?.getReader(); if (!reader) throw new Error("The website returned an empty response."); const chunks: Uint8Array[] = []; let total = 0; while (total < 350_000) { const { done, value } = await reader.read(); if (done) break; if (value) { total += value.byteLength; chunks.push(value); } } reader.cancel(); return { url: url.toString(), html: new TextDecoder().decode(Buffer.concat(chunks)) }; } throw new Error("The website redirected too many times."); };
const textFromHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 24_000);
const pageTitle = (html: string) => html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || null;
const extractLinks = (html: string, origin: URL) => Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)).map(match => { try { return new URL(match[1], origin); } catch { return null; } }).filter((url): url is URL => url !== null).filter(url => url.origin === origin.origin && /^https?:$/.test(url.protocol)).filter(url => !url.hash && !/[.](pdf|jpg|jpeg|png|gif|zip|docx?|xlsx?)$/i.test(url.pathname));
const crawlSite = async (initial: URL) => { const first = await readHtml(initial); const priority = /(about|solution|service|product|industry|case|resource|blog|faq|contact)/i; const candidates = extractLinks(first.html, new URL(first.url)); const pages = [first, ...candidates.filter(url => priority.test(url.pathname)).slice(0, 5).map(url => readHtml(url).catch(() => null))]; const results = (await Promise.all(pages)).filter((page): page is { url: string; html: string } => Boolean(page)); return results.map(page => ({ url: page.url, title: pageTitle(page.html), text: textFromHtml(page.html) })); };
const allowRequest = (request: Request) => { const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"; const cutoff = Date.now() - 60 * 60 * 1000; const recent = (requests.get(ip) || []).filter(time => time > cutoff); if (recent.length >= 5) return false; requests.set(ip, [...recent, Date.now()]); return true; };

export async function POST(request: Request) {
  if (!allowRequest(request)) return Response.json({ error: "Please wait before analyzing another site." }, { status: 429 });
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to scan a website and keep its evidence available for the conversation." }, { status: 401 });
    const { data: cookbook, error: cookbookError } = await supabase.from("cookbooks").select("analysis_used_at").eq("user_id", user.id).maybeSingle(); if (cookbookError) throw cookbookError;
    if (cookbook?.analysis_used_at) return Response.json({ error: "Your account’s free website analysis has already been used. You can still refine and save your Cookbook manually." }, { status: 429 });
    const { website } = await request.json() as { website?: string }; if (!website || typeof website !== "string") throw new Error("Enter a website URL first.");
    const pages = await crawlSite(await isSafeUrl(website)); if (pages.map(page => page.text).join(" ").length < 120) throw new Error("There was not enough public website content to analyze.");
    const canonicalWebsite = pages[0]?.url || website;
    const { data: session, error: sessionError } = await supabase.from("cookbook_sessions").insert({ user_id: user.id, website: canonicalWebsite, draft: { website: canonicalWebsite }, next_field: "audience" }).select("id").single(); if (sessionError || !session) throw sessionError || new Error("Could not start a Cookbook session.");
    const evidence = pages.map((page, position) => ({ session_id: session.id, user_id: user.id, url: page.url, title: page.title, excerpt: page.text.slice(0, 8_000), position })); const { error: evidenceError } = await supabase.from("cookbook_evidence").insert(evidence); if (evidenceError) throw evidenceError;
    const { error: usageError } = await supabase.from("cookbooks").upsert({ user_id: user.id, analysis_used_at: new Date().toISOString() }, { onConflict: "user_id" }); if (usageError) throw usageError;
    return Response.json({ sessionId: session.id, website: canonicalWebsite, question: { field: "audience", text: fieldQuestions.audience }, evidence: evidence.slice(0, 2).map(({ url, title, excerpt }) => ({ url, title, excerpt: excerpt.slice(0, 500) })) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not analyze that website." }, { status: 400 }); }
}
