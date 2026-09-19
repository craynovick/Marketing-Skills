export type AgentEventName = "question" | "research" | "draft" | "complete" | "failed";

export type AgentEvent = {
  type: AgentEventName;
  message?: string;
  retryable?: boolean;
  code?: string;
  question?: string;
  document?: { id: string; version: number; content: string };
  research?: { canonicalUrl: string; pageCount: number; confidence: number; reviewed: string[]; skipped: string[]; failed: string[] };
};

export type DocumentMetadata = {
  status?: "draft" | "review" | "accepted";
  quality?: Record<string, unknown>;
  unansweredQuestions?: string[];
  assumptions?: string[];
  evidenceReferences?: string[];
  researchMetadata?: Record<string, unknown>;
  validationChecklist?: string[];
};

export const workspaceError = (code: string, error: string, status: number, retryable = false) =>
  Response.json({ code, error, retryable }, { status });
