import {
  account,
  apiError,
  documentColumns,
  uuid,
} from "@/lib/cookbook-server";
export async function GET(request: Request) {
  try {
    const taskId = new URL(request.url).searchParams.get("skillId");
    if (!uuid(taskId))
      return Response.json({ error: "A task is required." }, { status: 400 });
    const { db, user } = await account();
    const { data, error } = await db
      .from("cookbook_documents")
      .select(documentColumns)
      .eq("skill_id", taskId)
      .eq("user_id", user.id)
      .order("version", { ascending: false })
      .limit(50);
    if (error) throw error;
    return Response.json({ versions: data });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const { skillId, content, expectedVersion, requestId } =
      await request.json();
    if (
      !uuid(skillId) ||
      !uuid(requestId) ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > 60000 ||
      !Number.isInteger(expectedVersion)
    )
      return Response.json(
        {
          error:
            "A complete draft, request ID and expected version are required.",
        },
        { status: 400 },
      );
    const { db } = await account();
    const { data, error } = await db.rpc("cookbook_save_document", {
      p_task: skillId,
      p_content: content,
      p_expected: expectedVersion,
      p_source: "user",
      p_operation: requestId,
    });
    if (error) throw error;
    return Response.json({ document: data });
  } catch (error) {
    return apiError(error);
  }
}
