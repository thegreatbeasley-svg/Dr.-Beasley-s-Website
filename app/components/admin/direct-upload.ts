import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type DirectUploadKind = "resource-pdf" | "resource-cover" | "book-cover" | "book-video";

const WHAT: Record<DirectUploadKind, string> = {
  "resource-pdf": "PDF",
  "resource-cover": "cover",
  "book-cover": "cover",
  "book-video": "video",
};

/**
 * Reads a JSON error body without throwing when the platform (e.g. Vercel's
 * 413/504 pages) answers with HTML or an empty body, and names the HTTP
 * status so a failure is never collapsed into a generic message.
 */
export async function readJson(res: Response): Promise<{
  error?: string;
  fieldErrors?: Record<string, string>;
  token?: string;
  path?: string;
  bucket?: string;
}> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function statusHint(status: number) {
  if (status === 401) return "your admin session has expired — please sign in again";
  if (status === 413) return "the request was too large for the server";
  return `HTTP ${status}`;
}

export async function uploadDirectly(
  kind: DirectUploadKind,
  file: File,
  onProgress: (message: string) => void
): Promise<string> {
  onProgress(`Preparing ${WHAT[kind]} upload…`);
  let signRes: Response;
  try {
    signRes = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
    });
  } catch {
    throw new Error("Could not reach the server to prepare the upload (network error at the signing step).");
  }
  const signData = await readJson(signRes);
  if (!signRes.ok || !signData.token || !signData.path || !signData.bucket) {
    throw new Error(
      signData.error ||
        `Could not prepare the upload (signing step failed: ${statusHint(signRes.status)}).`
    );
  }

  onProgress(`Uploading ${WHAT[kind]}…`);
  let storageError: { message: string } | null;
  try {
    ({ error: storageError } = await getSupabaseBrowserClient()
      .storage.from(signData.bucket)
      .uploadToSignedUrl(signData.path, signData.token, file));
  } catch (caught) {
    throw new Error(
      `Upload to storage failed (storage step): ${caught instanceof Error ? caught.message : "network error"}`
    );
  }
  if (storageError) {
    throw new Error(`Upload to storage failed (storage step): ${storageError.message}`);
  }

  return signData.path as string;
}
