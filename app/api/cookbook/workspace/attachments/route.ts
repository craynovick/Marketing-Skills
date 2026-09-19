import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const maxFiles = 5;
const maxBytes = 10 * 1024 * 1024;
const types = new Map([
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["text/plain", ".txt"],
  ["text/markdown", ".md"],
]);
const maxExtractedCharacters = 60_000;

function extension(name: string) { const match = /\.[a-z0-9]+$/i.exec(name); return match?.[0].toLowerCase() || ""; }
function supported(file: File) { return types.has(file.type) || [...types.values()].includes(extension(file.name)); }
function normalizedType(file: File) { return types.has(file.type) ? file.type : extension(file.name) === ".pdf" ? "application/pdf" : extension(file.name) === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : extension(file.name) === ".md" ? "text/markdown" : "text/plain"; }
async function extract(file: File, mimeType: string) {
  if (mimeType === "text/plain" || mimeType === "text/markdown") return (await file.text()).trim();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (mimeType.includes("wordprocessingml")) return (await mammoth.extractRawText({ buffer })).value.trim();
  const parser = new PDFParse({ data: buffer });
  try { return (await parser.getText()).text.trim(); } finally { await parser.destroy(); }
}

export async function GET(request: Request) {
  try {
    const skillId = new URL(request.url).searchParams.get("skillId");
    if (!skillId) return Response.json({ error: "A task is required." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to view files." }, { status: 401 });
    const { data, error } = await supabase.from("cookbook_attachments").select("id,file_name,mime_type,byte_size,extraction_status,created_at").eq("skill_id", skillId).eq("user_id", user.id).order("created_at", { ascending: true });
    if (error) throw error; return Response.json({ attachments: data || [] });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load files." }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData(); const skillId = form.get("skillId"); const files = form.getAll("files").filter((value): value is File => value instanceof File);
    if (typeof skillId !== "string" || !skillId || !files.length || files.length > maxFiles) return Response.json({ error: `Attach between 1 and ${maxFiles} files.` }, { status: 400 });
    if (files.some(file => !supported(file) || !file.size || file.size > maxBytes)) return Response.json({ error: "Files must be PDF, DOCX, TXT, or Markdown and no larger than 10 MB." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to attach files." }, { status: 401 });
    const { data: skill } = await supabase.from("cookbook_skills").select("id,project_id").eq("id", skillId).eq("user_id", user.id).maybeSingle();
    if (!skill) return Response.json({ error: "The selected task is not available." }, { status: 404 });
    const { count } = await supabase.from("cookbook_attachments").select("id", { count: "exact", head: true }).eq("skill_id", skill.id).eq("user_id", user.id);
    if ((count || 0) + files.length > maxFiles) return Response.json({ error: `A task can retain up to ${maxFiles} context files.` }, { status: 400 });
    const attachments = [];
    for (const file of files) {
      const mimeType = normalizedType(file); const extractedText = (await extract(file, mimeType)).slice(0, maxExtractedCharacters);
      if (!extractedText) return Response.json({ error: `${file.name} contains no readable text.` }, { status: 400 });
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const storagePath = `${user.id}/${skill.project_id}/${skill.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("cookbook-context").upload(storagePath, file, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;
      const { data, error } = await supabase.from("cookbook_attachments").insert({ user_id: user.id, skill_id: skill.id, file_name: file.name, mime_type: mimeType, byte_size: file.size, storage_path: storagePath, extracted_text: extractedText }).select("id,file_name,mime_type,byte_size,extraction_status,created_at").single();
      if (error || !data) { await supabase.storage.from("cookbook-context").remove([storagePath]); throw error || new Error("Could not save attachment."); }
      attachments.push(data);
    }
    return Response.json({ attachments }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not attach files." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id"); if (!id) return Response.json({ error: "An attachment is required." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return Response.json({ error: "Sign in to remove files." }, { status: 401 });
    const { data: attachment, error } = await supabase.from("cookbook_attachments").select("id,storage_path").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (error) throw error; if (!attachment) return Response.json({ error: "That file is not available." }, { status: 404 });
    const { error: removeError } = await supabase.storage.from("cookbook-context").remove([attachment.storage_path]); if (removeError) throw removeError;
    const { error: deleteError } = await supabase.from("cookbook_attachments").delete().eq("id", attachment.id).eq("user_id", user.id); if (deleteError) throw deleteError;
    return Response.json({ deletedId: id });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not remove file." }, { status: 400 }); }
}
