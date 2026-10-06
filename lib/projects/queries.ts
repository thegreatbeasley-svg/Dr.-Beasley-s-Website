import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { toProject, type Project, type ProjectRow, DEFAULT_RELATIONSHIP_NOTE } from "./types";

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// PUBLIC
// ============================================================

export function listPublishedProjects(): Project[] {
  const rows = getDb()
    .prepare(`SELECT * FROM projects WHERE published = 1 ORDER BY featured DESC, created_at DESC`)
    .all() as ProjectRow[];
  return rows.map(toProject);
}

export function getPublishedProjectBySlug(slug: string): Project | null {
  const row = getDb()
    .prepare(`SELECT * FROM projects WHERE slug = ? AND published = 1`)
    .get(slug) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

// ============================================================
// ADMIN
// ============================================================

export function listAllProjectsAdmin(): Project[] {
  const rows = getDb().prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as ProjectRow[];
  return rows.map(toProject);
}

export function getProjectById(id: string): Project | null {
  const row = getDb().prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as
    | ProjectRow
    | undefined;
  return row ? toProject(row) : null;
}

export function isProjectSlugTaken(slug: string, excludeId?: string): boolean {
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

export function createProject(input: ProjectInput): Project {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
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
      relationship_note: input.relationship_note || DEFAULT_RELATIONSHIP_NOTE,
      description: input.description ?? null,
      url: input.url ?? null,
      logo_path: input.logo_path ?? null,
      published: input.published ? 1 : 0,
      featured: input.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return getProjectById(id)!;
}

export type ProjectUpdateInput = Partial<ProjectInput>;

export function updateProject(id: string, input: ProjectUpdateInput): Project {
  const existing = getProjectById(id);
  if (!existing) throw new Error("Project not found");

  const merged = {
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    relationship_note: input.relationship_note ?? existing.relationship_note,
    description: input.description !== undefined ? input.description : existing.description,
    url: input.url !== undefined ? input.url : existing.url,
    logo_path: input.logo_path !== undefined ? input.logo_path : existing.logo_path,
    published: input.published !== undefined ? (input.published ? 1 : 0) : existing.published ? 1 : 0,
    featured: input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured ? 1 : 0,
    updated_at: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE projects SET
        name = @name, slug = @slug, relationship_note = @relationship_note,
        description = @description, url = @url, logo_path = @logo_path,
        published = @published, featured = @featured, updated_at = @updated_at
       WHERE id = @id`
    )
    .run({ ...merged, id });

  return getProjectById(id)!;
}
