import { readBrand } from "@/lib/cookbook-brand-server";
import {
  account,
  apiError,
  documentColumns,
  uuid,
} from "@/lib/cookbook-server";

const RUN_STALE_AFTER_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const taskId = new URL(request.url).searchParams.get("taskId");
    if (!uuid(taskId))
      return Response.json({ error: "A task is required." }, { status: 400 });
    const { db, user } = await account();
    const { data: task } = await db
      .from("cookbook_skills")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();
    if (!task) throw new Error("INVALID_TASK");
    const { data: thread } = await db
      .from("cookbook_threads")
      .select("id")
      .eq("skill_id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();
    const results = await Promise.all([
      thread
        ? db
            .from("cookbook_messages")
            .select("*")
            .eq("thread_id", thread.id)
            .eq("user_id", user.id)
            .order("sequence")
        : Promise.resolve({ data: [], error: null }),
      db
        .from("cookbook_documents")
        .select(documentColumns)
        .eq("skill_id", taskId)
        .eq("user_id", user.id)
        .order("version", { ascending: false })
        .limit(50),
      db
        .from("cookbook_attachments")
        .select("id,file_name,byte_size,extraction_status")
        .eq("skill_id", taskId)
        .eq("user_id", user.id),
      db
        .from("cookbook_agent_runs")
        .select("*")
        .eq("skill_id", taskId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    for (const result of results) if (result.error) throw result.error;
    const [history, versions, attachments, runs] = results;
    const run = runs.data?.[0];
    if (
      !run?.workflow_id && run?.status === "running" &&
      Date.now() - Date.parse(run.updated_at) > RUN_STALE_AFTER_MS
    ) {
      const { data } = await db
        .from("cookbook_agent_runs")
        .update({ status: "interrupted" })
        .eq("id", run.id)
        .eq("status", "running")
        .lt(
          "updated_at",
          new Date(Date.now() - RUN_STALE_AFTER_MS).toISOString(),
        )
        .select("*")
        .maybeSingle();
      if (data) Object.assign(run, data);
    }
    const [decisions, brand] = await Promise.all([
      db.from("cookbook_decisions").select("*").eq("task_id", taskId).eq("user_id", user.id).order("created_at"),
      task.context_scope === "task" ? Promise.resolve(null) : readBrand(db, user.id, taskId),
    ]);
    if (decisions.error) throw decisions.error;
    const references: {taskId:string;documentId:string}[] = versions.data?.[0]?.context_versions || [];
    const current = new Map([...(brand?.foundations || []), ...(brand?.legacy || [])].map(f => [f.id, f.accepted_version_id]));
    return Response.json({
      decisions: decisions.data, brand,
      task: { ...task, reviewSuggested: references.some(ref => current.get(ref.taskId) !== ref.documentId), document: versions.data?.[0], run_status: run?.status },
      messages: history.data
        ?.filter((row) => row.role !== "event")
        .map((row) => ({
          id: row.message_key || row.id,
          role: row.role,
          parts: row.parts || [{ type: "text", text: row.content }],
        })),
      versions: versions.data,
      attachments: attachments.data,
      run,
    });
  } catch (error) {
    return apiError(error);
  }
}
