import { requireTaskAccess } from "@/lib/cookbook-access";
import { start } from "workflow/api";
import { account, apiError, uuid } from "@/lib/cookbook-server";
import { cookbookV2Enabled } from "@/lib/cookbook-features";
import { cookbookWorkflow } from "@/lib/workflows/cookbook";
export async function POST(request: Request) {
  try {
    if (!cookbookV2Enabled()) return Response.json({ error: "Background runs are not enabled." }, { status: 404 });
    const { db, user } = await account();
    const { taskId, requestId, messages, attachmentIds = [] } = await request.json();
    const last = messages?.at(-1);
    const input = last?.role === "user" && Array.isArray(last.parts) ? last.parts.filter((p: {type: string})=>p.type==="text").map((p: {text: string})=>p.text).join("\n").trim() : "";
    if (!uuid(taskId) || !uuid(requestId) || !input || input.length>4000 || !Array.isArray(attachmentIds) || attachmentIds.length>5 || attachmentIds.some(id=>!uuid(id)))
      return Response.json({error:"Provide a valid task, request ID, message, and attachments."},{status:400});
    await requireTaskAccess(user.id,taskId);
    const { error } = await db.rpc("cookbook_queue_run", {p_task:taskId,p_run:requestId,p_input:input,p_attachments:attachmentIds});
    if(error) throw error;
    const { data: record, error: re } = await db.from("cookbook_agent_runs").select("workflow_id,status").eq("id",requestId).single();
    if(re) throw re;
    if(!record.workflow_id && record.status === "queued") {
      let candidate;
      try {
        candidate = await start(cookbookWorkflow,[requestId]);
      } catch (error) {
        // Release an unclaimed queue entry so Retry can submit again. A worker
        // that already claimed the run wins; a delayed worker cannot claim failed work.
        await db.from("cookbook_agent_runs").update({status:"failed",error:"Could not start background work. Please retry."})
          .eq("id",requestId).eq("status","queued").is("workflow_id",null);
        throw error;
      }
      const {error: attachError} = await db.from("cookbook_agent_runs").update({workflow_id:candidate.runId}).eq("id",requestId).is("workflow_id",null).eq("status","queued");
      if(attachError) throw attachError;
    }
    // Empty initial stream reconnects through the authenticated app run ID.
    // Submission finishes immediately and does not own background execution.
    return new Response("", {headers:{"Content-Type":"text/event-stream","x-vercel-ai-ui-message-stream":"v1","x-workflow-run-id":requestId,"Cache-Control":"no-store"}});
  } catch(error) { return apiError(error); }
}
