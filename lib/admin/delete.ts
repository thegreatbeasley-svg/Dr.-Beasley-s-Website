import "server-only";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/admin/session";
import { getResourceById } from "@/lib/resources/queries";
import { getArticleById } from "@/lib/articles/queries";
import { getBookById } from "@/lib/books/queries";
import { getProjectById } from "@/lib/projects/queries";
import { deleteCoverImage, deleteResourceFile } from "@/lib/resources/storage";

/**
 * Admin deletion for resources, articles, books and projects.
 *
 * ORDER (database first, storage second): a database row and its storage
 * objects can't be removed atomically across Supabase Postgres + Storage.
 * Deleting the row first means the worst failure mode is an orphaned
 * storage object (invisible, harmless, reported to the admin by path-less
 * message) — never a live public page whose file or cover has vanished.
 * A row that can't be deleted (e.g. download requests still reference it)
 * aborts before any file is touched.
 *
 * SHARED OBJECTS: a storage object is only removed if no OTHER row in any
 * content table references the same file/cover value.
 */

export type DeletableEntity = "resources" | "articles" | "books" | "projects";

export class DeleteError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const LABELS: Record<DeletableEntity, string> = {
  resources: "resource",
  articles: "article",
  books: "book",
  projects: "project",
};

const COVER_TABLES = ["resources", "articles", "books"] as const;

/** How many rows other than (table, id) reference this value in `column`. */
async function otherReferences(
  table: string,
  column: string,
  value: string,
  exclude: { table: string; id: string }
): Promise<number> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from(table).select("id").eq(column, value);
    if (table === exclude.table) query = query.neq("id", exclude.id);
    const { data, error } = await query;
    if (error) throw new DeleteError(`Could not check for shared files: ${error.message}`, 500);
    return data?.length ?? 0;
  }
  const db = getDb();
  const row =
    table === exclude.table
      ? (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ? AND id != ?`).get(value, exclude.id) as { n: number })
      : (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`).get(value) as { n: number });
  return row.n;
}

async function coverIsShared(cover: string, exclude: { table: string; id: string }) {
  for (const table of COVER_TABLES) {
    if ((await otherReferences(table, "cover_image_path", cover, exclude)) > 0) return true;
  }
  return false;
}

async function countDownloadRequests(resourceId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const { count, error } = await createSupabaseAdminClient()
      .from("resource_requests")
      .select("id", { count: "exact", head: true })
      .eq("resource_id", resourceId);
    if (error) throw new DeleteError(`Could not check download history: ${error.message}`, 500);
    return count ?? 0;
  }
  return (getDb().prepare(`SELECT COUNT(*) AS n FROM resource_requests WHERE resource_id = ?`).get(resourceId) as { n: number }).n;
}

async function deleteRow(table: DeletableEntity, id: string) {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await createSupabaseAdminClient().from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    getDb().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new DeleteError(`The ${LABELS[table]} could not be deleted (${detail}). Nothing was removed.`, 500);
  }
}

export async function deleteContent(
  entity: DeletableEntity,
  id: string
): Promise<{ title: string; warnings: string[] }> {
  const warnings: string[] = [];
  const exclude = { table: entity, id };

  if (entity === "resources") {
    const resource = await getResourceById(id);
    if (!resource) throw new DeleteError("That resource no longer exists.", 404);
    const requests = await countDownloadRequests(id);
    if (requests > 0) {
      throw new DeleteError(
        `This resource has ${requests} download request${requests === 1 ? "" : "s"} on record, which are kept for lead history. Unpublish it instead of deleting it.`,
        409
      );
    }
    await deleteRow("resources", id);
    if ((await otherReferences("resources", "file_path", resource.file_path, exclude)) === 0) {
      if (!(await deleteResourceFile(resource.file_path))) {
        warnings.push("The record was deleted, but its PDF could not be removed from storage.");
      }
    }
    if (resource.cover_image_path && !(await coverIsShared(resource.cover_image_path, exclude))) {
      if (!(await deleteCoverImage(resource.cover_image_path))) {
        warnings.push("The record was deleted, but its cover image could not be removed from storage.");
      }
    }
    return { title: resource.title, warnings };
  }

  if (entity === "articles" || entity === "books") {
    const item = entity === "articles" ? await getArticleById(id) : await getBookById(id);
    if (!item) throw new DeleteError(`That ${LABELS[entity]} no longer exists.`, 404);
    await deleteRow(entity, id);
    if (item.cover_image_path && !(await coverIsShared(item.cover_image_path, exclude))) {
      if (!(await deleteCoverImage(item.cover_image_path))) {
        warnings.push("The record was deleted, but its cover image could not be removed from storage.");
      }
    }
    return { title: item.title, warnings };
  }

  const project = await getProjectById(id);
  if (!project) throw new DeleteError("That project no longer exists.", 404);
  await deleteRow("projects", id);
  return { title: project.name, warnings };
}

/** Shared DELETE route handler: auth, typed-confirmation, then deleteContent. */
export async function handleDelete(req: Request, entity: DeletableEntity, id: string) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { confirm?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // fall through — missing confirmation is rejected below
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm this deletion." }, { status: 400 });
  }
  try {
    const result = await deleteContent(entity, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof DeleteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "The deletion failed unexpectedly. Nothing further was changed." }, { status: 500 });
  }
}
