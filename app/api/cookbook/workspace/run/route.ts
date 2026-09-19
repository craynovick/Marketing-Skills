import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function PATCH(request: Request) {
  try {
    const { runId } = await request.json();
    if (!uuid(runId))
      return Response.json({ error: "A run is required." }, { status: 400 });
    const { db, user } = await account();
    const { error } = await db
      .from("cookbook_agent_runs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("user_id", user.id)
      .eq("status", "running");
    if (error) throw error;
    return Response.json({ stopped: true });
  } catch (error) {
    return apiError(error);
  }
}
