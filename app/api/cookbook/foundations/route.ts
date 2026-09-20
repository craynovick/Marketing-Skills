import { account, apiError, uuid } from "@/lib/cookbook-server";
import { readBrand } from "@/lib/cookbook-brand-server";
import { validateBrandUpdates } from "@/lib/cookbook-foundations";
export async function GET(request: Request) {
  try {
    const { db, user } = await account();
    const taskId = new URL(request.url).searchParams.get("taskId") || undefined;
    if (taskId && !uuid(taskId)) return Response.json({ error: "Invalid task." }, { status: 400 });
    return Response.json({ enabled: true, ...await readBrand(db, user.id, taskId) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const { db } = await account();
    const body = await request.json();
    if (body.action === "kept" || body.action === "skipped") {
      if (!uuid(body.proposalId)) return Response.json({ error: "Choose a proposal." }, { status: 400 });
      const { data, error } = await db.rpc("cookbook_review_brand", { p_proposal: body.proposalId, p_action: body.action });
      if (error) throw error;
      return Response.json({ proposal: data });
    }
    if (!uuid(body.taskId) || !uuid(body.requestId)) return Response.json({ error: "A task and request ID are required." }, { status: 400 });
    try { validateBrandUpdates(body.updates); } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
    const { data, error } = await db.rpc("cookbook_propose_brand", { p_task: body.taskId, p_updates: body.updates, p_operation: body.requestId });
    if (error) throw error;
    return Response.json({ proposal: data });
  } catch (error) { return apiError(error); }
}
