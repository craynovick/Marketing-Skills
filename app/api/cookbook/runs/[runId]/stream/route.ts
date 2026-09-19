import { getRun } from "workflow/api";
import { createModelCallToUIChunkTransform } from "@ai-sdk/workflow";
import { createUIMessageStreamResponse } from "ai";
import { account, apiError, uuid } from "@/lib/cookbook-server";
export const maxDuration = 60;
export async function GET(request: Request, {params}: {params: Promise<{runId:string}>}) {
  try {
    const {runId}=await params;
    const {db,user}=await account();
    if(!uuid(runId)) return Response.json({error:"Invalid run."},{status:400});
    let {data:run,error}=await db.from("cookbook_agent_runs").select("workflow_id,status").eq("id",runId).eq("user_id",user.id).maybeSingle();
    if(error) throw error;
    if(!run) {
      const latest=await db.from("cookbook_agent_runs").select("workflow_id,status").eq("skill_id",runId).eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(latest.error) throw latest.error;
      run=latest.data;
    }
    if(!run) return Response.json({error:"Run unavailable."},{status:404});
    if(run.status==="cancelled") return new Response('data: {"type":"finish"}\n\ndata: [DONE]\n\n',{headers:{"Content-Type":"text/event-stream"}});
    if(!run.workflow_id) return Response.json({error:"Run is queued. Reconnecting…"},{status:503});
    const cursor=Number(new URL(request.url).searchParams.get("startIndex") || 0);
    if(!Number.isSafeInteger(cursor)||cursor<0) return Response.json({error:"Invalid stream cursor."},{status:400});
    // The transport counts UI chunks, not raw model parts. Replay raw parts
    // from zero and let the SDK omit exactly the UI chunks already received.
    const stream=getRun(run.workflow_id).getReadable({startIndex:0});
    return createUIMessageStreamResponse({stream:stream.pipeThrough(createModelCallToUIChunkTransform({uiStartIndex:cursor})),headers:{"Cache-Control":"no-store"}});
  } catch(error) {return apiError(error);}
}
