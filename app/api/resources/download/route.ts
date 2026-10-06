import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getResourceRequestWithResource } from "@/lib/resources/queries";
import { resolveResourceFilePath } from "@/lib/db";

function contentDispositionFileName(name: string) {
  // Strip anything that could break out of the header value or introduce
  // a path — this only ever affects the filename shown to the browser.
  const safe = name.replace(/[\r\n"]/g, "").replace(/[/\\]/g, "-");
  return safe || "resource.pdf";
}

/**
 * Controlled download route: the public link carries only an opaque
 * request id, never the real storage path. Publication state is
 * re-checked on every hit, so unpublishing a resource immediately stops
 * new downloads via any previously issued link.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const found = getResourceRequestWithResource(token);
  if (!found) {
    return NextResponse.redirect(new URL("/?download=not-found", req.url));
  }

  const { resource } = found;
  if (!resource.published) {
    return NextResponse.redirect(new URL("/?download=unavailable", req.url));
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(resolveResourceFilePath(resource.file_path));
  } catch (error) {
    console.error("Failed to read resource file:", error);
    return NextResponse.redirect(new URL("/?download=unavailable", req.url));
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${contentDispositionFileName(resource.file_name)}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
