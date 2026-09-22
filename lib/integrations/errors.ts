import { ZodError } from 'zod';
const errors: Record<string, [number, string]> = {
  PACK_AUTH_REQUIRED: [401, 'Sign in to save your brand pack and run research.'],
  PACKS_DISABLED: [503, 'Brand pack setup is not enabled on this installation yet. You can still install the skills and set up your brand in your AI app.'],
  WEBSITE_REQUIRED: [400, 'Add an official website to run web research, or continue with your brief in your AI app.'],
  RUN_ACTIVE: [409, 'Research is already running. Wait or stop it before editing.'],
  BRAND_REQUIRED: [409, 'Choose which brand to connect.'], INVALID_BRAND: [400, 'Choose a valid brand.'],
  DISABLED: [404, 'Cookbook integrations are not enabled.'], AUTH_REQUIRED: [401, 'A valid, unexpired Cookbook connection key is required.'],
  FORBIDDEN: [403, 'This connection does not have the required permission.'], PLAN_REQUIRED: [403, 'This operation requires a paid hosted plan. Brand foundations remain free.'],
  NOT_FOUND: [404, 'The requested item is not available.'], INVALID_TASK: [404, 'The task is not available.'],
  STALE_VERSION: [409, 'This document changed. Read the latest version and review your update before retrying.'],
  IDEMPOTENCY_CONFLICT: [409, 'This request ID was already used with different content.'],
  RATE_LIMITED: [429, 'Too many requests. Try again later.'], CONNECTION_LIMIT: [409, 'Revoke an existing connection before creating another.'],
  SCAN_ACTIVE: [409, 'A website scan is already in progress.'], SCAN_LIMIT: [403, 'Free website setup is complete or its four successful scans have been used.'],
  SITE_LOCKED: [403, 'Free follow-up scans must use your original website.'], EVIDENCE_GAP_REQUIRED: [400, 'Choose an unfinished foundation and describe the missing evidence.'],
  FOUNDATION_COMPLETE: [409, 'Choose an unfinished foundation for the follow-up scan.'], SCAN_EXPIRED: [409, 'The scan reservation expired. Retry the scan.'],
  INVALID_DOCUMENT: [400, 'Provide a valid request and document.'], INVALID_REQUEST: [400, 'The request is invalid.'], TOO_LARGE: [413, 'The request is too large.'],
};
export function failure(error: unknown) {
  if (error instanceof ZodError || error instanceof SyntaxError) return {status: 400, code: 'INVALID_REQUEST', error: 'Check the request fields, sizes, and identifiers.'};
  const raw = error instanceof Error ? error.message : String((error as {message?: string})?.message || '');
  const code = Object.keys(errors).find(k => raw === k || raw.includes(k)) || 'REQUEST_FAILED';
  const [status, message] = errors[code] || [500, 'Cookbook could not complete this request. Please retry.'];
  return {status, code, error: message};
}
export function errorResponse(error: unknown) {
  const {status, ...body} = failure(error);
  return Response.json(body, {status, headers: {'Cache-Control': 'no-store', ...(status === 429 ? {'Retry-After': '60'} : {})}});
}
export async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 300000) throw new Error('TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_REQUEST');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    length += value.length;
    if (length > 300000) {await reader.cancel(); throw new Error('TOO_LARGE');}
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
