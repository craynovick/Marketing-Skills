/** Explicit requests for an unrelated brief never load account memory. */
export function requestsTaskOnlyContext(text: string) {
  return /\b(?:fictional|hypothetical|unrelated|different)\s+(?:[\w-]+\s+){0,3}(?:brand|company|business)\b|\b(?:brand|company|business)\b[^.!?\n]{0,40}\bfictional\b|\b(?:ignore|exclude|without)\s+(?:my|the|account|saved)\s+(?:brand|context)\b/i.test(text);
}
