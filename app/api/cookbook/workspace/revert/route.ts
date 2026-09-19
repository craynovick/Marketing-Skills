import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function POST(request: Request) {
  try {
    const { skillId, version, expectedVersion, requestId } =
      await request.json();
    if (
      !uuid(skillId) ||
      !uuid(requestId) ||
      !Number.isInteger(version) ||
      !Number.isInteger(expectedVersion)
    )
      return Response.json(
        { error: "Choose a version and provide the current version." },
        { status: 400 },
      );
    const { db, user } = await account();
    const { data: target, error: readError } = await db
      .from("cookbook_documents")
      .select("content")
      .eq("skill_id", skillId)
      .eq("user_id", user.id)
      .eq("version", version)
      .single();
    if (readError) throw readError;
    const { data, error } = await db.rpc("cookbook_save_document", {
      p_task: skillId,
      p_content: target.content,
      p_expected: expectedVersion,
      p_source: "revert",
      p_operation: requestId,
    });
    if (error) throw error;
    return Response.json({ document: data });
  } catch (error) {
    return apiError(error);
  }
}
