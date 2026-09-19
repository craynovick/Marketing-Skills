export function safeReturnPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return "/create";
  try {
    const base = "https://cookbook.invalid";
    const url = new URL(value, base);
    return url.origin === base
      ? url.pathname + url.search + url.hash
      : "/create";
  } catch {
    return "/create";
  }
}
