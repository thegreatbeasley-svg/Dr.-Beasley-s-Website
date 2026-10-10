import "server-only";
import crypto from "node:crypto";

/**
 * Structured, non-sensitive upload diagnostics. Only the stage, a random
 * request id, an HTTP status, the upload kind and a sanitized error class
 * are ever logged — never cookies, tokens, signed URLs, env values,
 * emails, or file contents.
 */
export function newUploadRequestId() {
  return crypto.randomUUID().slice(0, 8);
}

export function logUploadStage(entry: {
  stage: string;
  requestId: string;
  status?: number;
  kind?: string;
  mode?: "direct" | "server";
  errorClass?: string;
}) {
  console.log(JSON.stringify({ tag: "resource-upload", ...entry }));
}

export function errorClass(error: unknown) {
  return error instanceof Error ? error.constructor.name : typeof error;
}
