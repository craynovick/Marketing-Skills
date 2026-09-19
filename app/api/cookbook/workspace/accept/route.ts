import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function POST(request: Request) {
  try {
    const { skillId, version } = await request.json();
    if (!uuid(skillId) || !Number.isInteger(version))
      return Response.json(
        { error: "A reviewed draft version is required." },
        { status: 400 },
      );
    const { db } = await account();
    const { data, error } = await db.rpc("cookbook_accept_document", {
      p_task: skillId,
      p_version: version,
    });
    if (error) throw error;
    return Response.json({ acceptedVersionId: data, version });
  } catch (error) {
    return apiError(error);
  }
}
