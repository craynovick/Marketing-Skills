import { getRun } from "workflow/api";
import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function PATCH(request: Request) {
  try {
    const { runId } = await request.json();
    if (!uuid(runId))
      return Response.json({ error: "A run is required." }, { status: 400 });
    const { db, user } = await account();
    const { data: run, error: readError } = await db.from("cookbook_agent_runs").select("*").eq("id", runId).eq("user_id", user.id).maybeSingle();
    if (readError) throw readError;
    if (!run) throw new Error("INVALID_TASK");
    const { error } = await db
      .from("cookbook_agent_runs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", user.id)
      .in("status", ["queued", "running"]);
    if (error) throw error;
    if (run.workflow_id && ["queued", "running"].includes(run.status)) await getRun(run.workflow_id).cancel();
    return Response.json({ stopped: true });
  } catch (error) {
    return apiError(error);
  }
}
