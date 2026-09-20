export type RunLifecycle =
  | "starting"
  | "queued"
  | "running"
  | "awaiting_input"
  | "completed"
  | "failed"
  | "cancelled";

type PersistedRun = { status?: string | null } | null | undefined;
type TransportStatus = "submitted" | "streaming" | "ready" | "error";

const persistedLifecycles = new Set<RunLifecycle>([
  "queued",
  "running",
  "awaiting_input",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * Persisted state is the lifecycle authority. Transport state is only used
 * before the server has returned the newly-created run.
 */
export function runLifecycle(
  run: PersistedRun,
  transportStatus: TransportStatus,
): RunLifecycle | null {
  const status = run?.status === "interrupted" ? "failed" : run?.status;
  if (status && persistedLifecycles.has(status as RunLifecycle))
    return status as RunLifecycle;
  if (transportStatus === "submitted") return "starting";
  if (transportStatus === "streaming") return "running";
  if (transportStatus === "error") return "failed";
  return null;
}

export const activeRunLifecycle = (lifecycle: RunLifecycle | null) =>
  lifecycle === "starting" || lifecycle === "queued" || lifecycle === "running";

export const terminalRunLifecycle = (lifecycle: RunLifecycle | null) =>
  lifecycle === "failed" || lifecycle === "cancelled";
