import { z } from "zod";
import { sectionKeys } from "@/lib/integrations/contracts";
import { hostedLimitsEnabled } from "@/lib/cookbook-access";
import { entitlementsForUser } from "@/lib/entitlements";
import { hasActiveSubscription, isPaidPlan, type Plan, type SubscriptionStatus } from "@/lib/billing";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { fieldQuestions } from "@/lib/cookbook-session";
import { scanWebsiteForUser } from "@/lib/cookbook-scraper";
import { errorResponse, readBody } from "@/lib/integrations/errors";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to scan a website and keep its evidence available for the conversation." }, { status: 401 });
    if (!hostedLimitsEnabled()) {
      const [{data:profile,error:pe},{data:subscription,error:se}] = await Promise.all([
        supabase.from("cookbooks").select("analysis_used_at").eq("user_id",user.id).maybeSingle(),
        supabase.from("subscriptions").select("plan,status").eq("user_id",user.id).maybeSingle(),
      ]);
      if(pe || se) throw pe || se;
      if(profile?.analysis_used_at && !entitlementsForUser(user).unlimited && !(isPaidPlan(subscription?.plan as Plan) && hasActiveSubscription(subscription?.status as SubscriptionStatus))) throw new Error("SCAN_LIMIT");
    }
    const {website,requestId,foundation,gap} = z.object({website:z.string().min(1).max(2000),requestId:z.string().uuid().default(()=>randomUUID()),foundation:z.enum(sectionKeys).optional(),gap:z.string().max(1000).optional()}).strict().parse(await readBody(request));
    const result = await scanWebsiteForUser(user.id,website,{requestId,foundation,gap},async scraped => { const pages = scraped.pages; const canonicalWebsite = scraped.website;
    const { data: session, error: sessionError } = await supabase.from("cookbook_sessions").insert({ user_id: user.id, website: canonicalWebsite, draft: { website: canonicalWebsite }, next_field: "audience" }).select("id").single(); if (sessionError || !session) throw sessionError || new Error("Could not start a Cookbook session.");
    const evidence = pages.map((page, position) => ({ session_id: session.id, user_id: user.id, url: page.url, title: page.title, excerpt: page.text.slice(0, 8_000), position })); const { error: evidenceError } = await supabase.from("cookbook_evidence").insert(evidence); if (evidenceError) throw evidenceError;
    const { error: usageError } = await supabase.from("cookbooks").upsert({ user_id: user.id, analysis_used_at: new Date().toISOString() }, { onConflict: "user_id" }); if (usageError) throw usageError;
    return { sessionId: session.id, website: canonicalWebsite, question: { field: "audience", text: fieldQuestions.audience }, evidence: evidence.slice(0, 2).map(({ url, title, excerpt }) => ({ url, title, excerpt: excerpt.slice(0, 500) })) };
    });
    return Response.json(result);
  } catch (error) { return errorResponse(error); }
}
