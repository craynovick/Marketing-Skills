import { getRun } from "workflow/api";
import { createModelCallToUIChunkTransform } from "@ai-sdk/workflow";
import { createUIMessageStreamResponse } from "ai";
import { account, apiError, uuid } from "@/lib/cookbook-server";
export const maxDuration = 60;
const ATTACH_WAIT_MS = 25_000;
const ATTACH_POLL_MS = 250;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function GET(request: Request, {params}: {params: Promise<{runId:string}>}) {
  try {
    const {runId}=await params;
    const {db,user}=await account();
    if(!uuid(runId)) return Response.json({error:"Invalid run."},{status:400});
    let {data:run,error}=await db.from("cookbook_agent_runs").select("id,workflow_id,status").eq("id",runId).eq("user_id",user.id).maybeSingle();
    if(error) throw error;
    if(!run) {
      const latest=await db.from("cookbook_agent_runs").select("id,workflow_id,status").eq("skill_id",runId).eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(latest.error) throw latest.error;
      run=latest.data;
    }
    if(!run) return Response.json({error:"Run unavailable."},{status:404});
    let currentRun: {id:string;workflow_id:string|null;status:string} = run;
    if(currentRun.status==="cancelled") return new Response('data: {"type":"finish"}\n\ndata: [DONE]\n\n',{headers:{"Content-Type":"text/event-stream"}});
    // A reconnect can arrive while POST is still attaching the workflow ID.
    // Keep this transport request pending instead of turning normal queueing
    // into a terminal SDK error.
    const deadline = Date.now() + ATTACH_WAIT_MS;
    while (!currentRun.workflow_id && ["queued", "running"].includes(currentRun.status) && Date.now() < deadline) {
      await wait(ATTACH_POLL_MS);
      const latest = await db.from("cookbook_agent_runs").select("id,workflow_id,status").eq("id",currentRun.id).eq("user_id",user.id).maybeSingle();
      if (latest.error) throw latest.error;
      if (latest.data) currentRun = latest.data;
    }
    if(!currentRun.workflow_id) {
      const active = ["queued", "running"].includes(currentRun.status);
      return Response.json(
        {error:active ? "Run is still waiting for an agent." : "Run is no longer active.", code:active ? "RUN_ATTACHING" : "RUN_TERMINAL", status:currentRun.status},
        {status:active ? 425 : 409, headers:{"Retry-After":"2","Cache-Control":"no-store"}},
      );
    }
    const cursor=Number(new URL(request.url).searchParams.get("startIndex") || 0);
    if(!Number.isSafeInteger(cursor)||cursor<0) return Response.json({error:"Invalid stream cursor."},{status:400});
    // The transport counts UI chunks, not raw model parts. Replay raw parts
    // from zero and let the SDK omit exactly the UI chunks already received.
    const stream=getRun(currentRun.workflow_id).getReadable({startIndex:0});
    return createUIMessageStreamResponse({stream:stream.pipeThrough(createModelCallToUIChunkTransform({uiStartIndex:cursor})),headers:{"Cache-Control":"no-store"}});
  } catch(error) {return apiError(error);}
}
