import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap, unwrapNullable } from "@/lib/supabase/admin";
import { toProject, type Project, type ProjectRow, DEFAULT_RELATIONSHIP_NOTE } from "./types";

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// PUBLIC
// ============================================================

export async function listPublishedProjects(): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
    ) as ProjectRow[];
    return rows.map(toProject);
  }
  const rows = getDb()
    .prepare(`SELECT * FROM projects WHERE published = 1 ORDER BY featured DESC, created_at DESC`)
    .all() as ProjectRow[];
  return rows.map(toProject);
}

export async function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient()
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
    ) as ProjectRow | null;
    return row ? toProject(row) : null;
  }
  const row = getDb()
    .prepare(`SELECT * FROM projects WHERE slug = ? AND published = 1`)
    .get(slug) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

// ============================================================
// ADMIN
// ============================================================

export async function listAllProjectsAdmin(): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient().from("projects").select("*").order("created_at", { ascending: false })
    ) as ProjectRow[];
    return rows.map(toProject);
  }
  const rows = getDb().prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as ProjectRow[];
  return rows.map(toProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient().from("projects").select("*").eq("id", id).maybeSingle()
    ) as ProjectRow | null;
    return row ? toProject(row) : null;
  }
  const row = getDb().prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as
    | ProjectRow
    | undefined;
  return row ? toProject(row) : null;
}

export async function isProjectSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from("projects").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const row = unwrapNullable(await query.maybeSingle());
    return Boolean(row);
  }
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM projects WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM projects WHERE slug = ?`).get(slug);
  return Boolean(row);
}

export type ProjectInput = {
  name: string;
  slug: string;
  relationship_note?: string;
  description?: string | null;
  url?: string | null;
  logo_path?: string | null;
  published: boolean;
  featured?: boolean;
};

export async function createProject(input: ProjectInput): Promise<Project> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const relationshipNote = input.relationship_note || DEFAULT_RELATIONSHIP_NOTE;

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("projects")
        .insert({
          id,
          name: input.name,
          slug: input.slug,
          relationship_note: relationshipNote,
          description: input.description ?? null,
          url: input.url ?? null,
          logo_path: input.logo_path ?? null,
          published: Boolean(input.published),
          featured: Boolean(input.featured),
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
    );
    return (await getProjectById(id))!;
  }

  getDb()
    .prepare(
      `INSERT INTO projects
        (id, name, slug, relationship_note, description, url, logo_path, published, featured,
         created_at, updated_at)
       VALUES (@id, @name, @slug, @relationship_note, @description, @url, @logo_path, @published,
         @featured, @created_at, @updated_at)`
    )
    .run({
      id,
      name: input.name,
      slug: input.slug,
      relationship_note: relationshipNote,
      description: input.description ?? null,
      url: input.url ?? null,
      logo_path: input.logo_path ?? null,
      published: input.published ? 1 : 0,
      featured: input.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return (await getProjectById(id))!;
}

export type ProjectUpdateInput = Partial<ProjectInput>;

export async function updateProject(id: string, input: ProjectUpdateInput): Promise<Project> {
  const existing = await getProjectById(id);
  if (!existing) throw new Error("Project not found");

  const merged = {
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    relationship_note: input.relationship_note ?? existing.relationship_note,
    description: input.description !== undefined ? input.description : existing.description,
    url: input.url !== undefined ? input.url : existing.url,
    logo_path: input.logo_path !== undefined ? input.logo_path : existing.logo_path,
    published: input.published !== undefined ? input.published : existing.published,
    featured: input.featured !== undefined ? input.featured : existing.featured,
    updated_at: nowIso(),
  };

  if (isSupabaseConfigured()) {
    unwrap(await createSupabaseAdminClient().from("projects").update(merged).eq("id", id).select());
    return (await getProjectById(id))!;
  }

  getDb()
    .prepare(
      `UPDATE projects SET
        name = @name, slug = @slug, relationship_note = @relationship_note,
        description = @description, url = @url, logo_path = @logo_path,
        published = @published, featured = @featured, updated_at = @updated_at
       WHERE id = @id`
    )
    .run({
      ...merged,
      published: merged.published ? 1 : 0,
      featured: merged.featured ? 1 : 0,
      id,
    });

  return (await getProjectById(id))!;
}
