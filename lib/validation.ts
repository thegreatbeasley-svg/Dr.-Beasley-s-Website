export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/** Converts CRLF and lone CR line endings to LF. */
export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

/**
 * Like clean(), for multi-line long-form fields (article bodies, answers,
 * descriptions). Multipart form submissions arrive with CRLF line endings,
 * so they are normalized to LF before trimming and length-limiting.
 */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return normalizeLineEndings(value).trim().slice(0, maxLength);
}
