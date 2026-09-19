export type Draft = {
  id: string;
  content: string;
  version: number;
  source: string;
  created_at: string;
  assumptions?: string[];
  unanswered_questions?: string[];
  evidence_references?: string[];
};
export type Task = {
  id: string;
  title: string;
  file_name: string;
  skill_slug: string | null;
  skill_version: string | null;
  archived_at: string | null;
  lifecycle: string;
  accepted_version_id: string | null;
  document?: Draft | null;
};
export type Attachment = {
  id: string;
  file_name: string;
  byte_size: number;
  extraction_status: string;
};
export type Run = {
  id: string;
  status: string;
  input: string;
  error?: string;
  events: { tool: string; state: string; detail: unknown }[];
};
export async function requestJSON<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The service returned an unreadable response. Please retry.",
    );
  }
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "Request failed. Please retry."),
      { status: response.status, code: data.code },
    );
  return data;
}
export const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please retry.";
