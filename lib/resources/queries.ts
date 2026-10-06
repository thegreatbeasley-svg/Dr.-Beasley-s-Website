import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import {
  toResource,
  toLead,
  type Resource,
  type ResourceRow,
  type ResourceType,
  type Lead,
  type LeadRow,
  type LeadWithRequests,
  type ResourceWithRequestCount,
} from "./types";
import { deleteCoverImage, deleteResourceFile } from "./storage";

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// RESOURCES — public reads
// ============================================================

export function listPublishedResources(): Resource[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM resources WHERE published = 1
       ORDER BY featured DESC, created_at DESC`
    )
    .all() as ResourceRow[];
  return rows.map(toResource);
}

export function getPublishedResourceBySlug(slug: string): Resource | null {
  const row = getDb()
    .prepare(`SELECT * FROM resources WHERE slug = ? AND published = 1`)
    .get(slug) as ResourceRow | undefined;
  return row ? toResource(row) : null;
}

// ============================================================
// RESOURCES — admin
// ============================================================

export function listAllResourcesAdmin(): ResourceWithRequestCount[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM resources ORDER BY created_at DESC`)
    .all() as ResourceRow[];
  const counts = db
    .prepare(
      `SELECT resource_id, COUNT(*) as count FROM resource_requests GROUP BY resource_id`
    )
    .all() as { resource_id: string; count: number }[];
  const countMap = new Map(counts.map((c) => [c.resource_id, c.count]));
  return rows.map((row) => ({ ...toResource(row), request_count: countMap.get(row.id) ?? 0 }));
}

export function getResourceById(id: string): Resource | null {
  const row = getDb().prepare(`SELECT * FROM resources WHERE id = ?`).get(id) as
    | ResourceRow
    | undefined;
  return row ? toResource(row) : null;
}

export function isSlugTaken(slug: string, excludeId?: string): boolean {
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM resources WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM resources WHERE slug = ?`).get(slug);
  return Boolean(row);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ResourceInput = {
  title: string;
  slug: string;
  short_description: string;
  long_description?: string | null;
  resource_type: ResourceType | string;
  file_path: string;
  file_name: string;
  file_size: number;
  cover_image_path?: string | null;
  is_demo_content?: boolean;
  published: boolean;
  featured?: boolean;
};

export function createResource(input: ResourceInput): Resource {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO resources
        (id, title, slug, short_description, long_description, resource_type,
         file_path, file_name, file_size, cover_image_path, is_demo_content,
         published, featured, created_at, updated_at)
       VALUES (@id, @title, @slug, @short_description, @long_description, @resource_type,
         @file_path, @file_name, @file_size, @cover_image_path, @is_demo_content,
         @published, @featured, @created_at, @updated_at)`
    )
    .run({
      id,
      title: input.title,
      slug: input.slug,
      short_description: input.short_description,
      long_description: input.long_description ?? null,
      resource_type: input.resource_type,
      file_path: input.file_path,
      file_name: input.file_name,
      file_size: input.file_size,
      cover_image_path: input.cover_image_path ?? null,
      is_demo_content: input.is_demo_content === false ? 0 : 1,
      published: input.published ? 1 : 0,
      featured: input.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
  return getResourceById(id)!;
}

export type ResourceUpdateInput = Partial<ResourceInput>;

export function updateResource(id: string, input: ResourceUpdateInput): Resource {
  const existing = getResourceById(id);
  if (!existing) throw new Error("Resource not found");

  const merged = {
    title: input.title ?? existing.title,
    slug: input.slug ?? existing.slug,
    short_description: input.short_description ?? existing.short_description,
    long_description:
      input.long_description !== undefined ? input.long_description : existing.long_description,
    resource_type: input.resource_type ?? existing.resource_type,
    file_path: input.file_path ?? existing.file_path,
    file_name: input.file_name ?? existing.file_name,
    file_size: input.file_size ?? existing.file_size,
    cover_image_path:
      input.cover_image_path !== undefined ? input.cover_image_path : existing.cover_image_path,
    is_demo_content:
      input.is_demo_content !== undefined ? (input.is_demo_content ? 1 : 0) : existing.is_demo_content ? 1 : 0,
    published: input.published !== undefined ? (input.published ? 1 : 0) : existing.published ? 1 : 0,
    featured: input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured ? 1 : 0,
    updated_at: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE resources SET
        title = @title, slug = @slug, short_description = @short_description,
        long_description = @long_description, resource_type = @resource_type,
        file_path = @file_path, file_name = @file_name, file_size = @file_size,
        cover_image_path = @cover_image_path, is_demo_content = @is_demo_content,
        published = @published, featured = @featured, updated_at = @updated_at
       WHERE id = @id`
    )
    .run({ ...merged, id });

  return getResourceById(id)!;
}

export async function replaceResourceFile(resourceId: string, fileName: string, size: number) {
  const existing = getResourceById(resourceId);
  if (!existing) throw new Error("Resource not found");
  updateResource(resourceId, { file_path: fileName, file_name: fileName, file_size: size });
  await deleteResourceFile(existing.file_path);
}

export async function replaceCoverImage(resourceId: string, coverPath: string) {
  const existing = getResourceById(resourceId);
  if (!existing) throw new Error("Resource not found");
  updateResource(resourceId, { cover_image_path: coverPath });
  await deleteCoverImage(existing.cover_image_path);
}

// ============================================================
// LEAD CAPTURE
// ============================================================

export type CaptureLeadInput = {
  name: string;
  email: string;
  city?: string | null;
  updates_opt_in: boolean;
  resource_id: string;
};

/**
 * A lead is keyed by email. Repeat requests update name/city with the
 * latest values, and an opt-in can only ever turn ON here — a later
 * request that leaves the box unchecked never silently revokes a
 * previously given consent (a real unsubscribe flow is separate, future
 * work; see README).
 */
export function captureLeadAndRequestResource(input: CaptureLeadInput): {
  lead: Lead;
  request: { id: string; requested_at: string };
} {
  const db = getDb();
  const email = input.email.toLowerCase();
  const timestamp = nowIso();

  const existingRow = db.prepare(`SELECT * FROM leads WHERE email = ?`).get(email) as
    | LeadRow
    | undefined;

  let leadId: string;
  if (existingRow) {
    leadId = existingRow.id;
    const nextOptIn = existingRow.updates_opt_in === 1 || input.updates_opt_in;
    db.prepare(
      `UPDATE leads SET name = ?, city = ?, updates_opt_in = ?,
        updates_opt_in_at = CASE WHEN ? = 1 AND updates_opt_in_at IS NULL THEN ? ELSE updates_opt_in_at END,
        updated_at = ?
       WHERE id = ?`
    ).run(
      input.name,
      input.city ?? null,
      nextOptIn ? 1 : 0,
      nextOptIn ? 1 : 0,
      timestamp,
      timestamp,
      leadId
    );
  } else {
    leadId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO leads (id, name, city, email, updates_opt_in, updates_opt_in_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      leadId,
      input.name,
      input.city ?? null,
      email,
      input.updates_opt_in ? 1 : 0,
      input.updates_opt_in ? timestamp : null,
      timestamp,
      timestamp
    );
  }

  const requestId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO resource_requests (id, lead_id, resource_id, opted_in_this_request, requested_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(requestId, leadId, input.resource_id, input.updates_opt_in ? 1 : 0, timestamp);

  const leadRow = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(leadId) as LeadRow;
  return { lead: toLead(leadRow), request: { id: requestId, requested_at: timestamp } };
}

export function getResourceRequestWithResource(requestId: string) {
  const db = getDb();
  const request = db
    .prepare(`SELECT * FROM resource_requests WHERE id = ?`)
    .get(requestId) as { id: string; resource_id: string } | undefined;
  if (!request) return null;
  const resource = getResourceById(request.resource_id);
  if (!resource) return null;
  return { request, resource };
}

// ============================================================
// LEADS — admin
// ============================================================

export function listLeadsAdmin(): LeadWithRequests[] {
  const db = getDb();
  const leads = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all() as LeadRow[];
  if (leads.length === 0) return [];

  const requests = db
    .prepare(
      `SELECT rr.lead_id, rr.requested_at, rr.opted_in_this_request, r.title as resource_title
       FROM resource_requests rr
       JOIN resources r ON r.id = rr.resource_id
       ORDER BY rr.requested_at ASC`
    )
    .all() as {
    lead_id: string;
    requested_at: string;
    opted_in_this_request: number;
    resource_title: string;
  }[];

  const byLead = new Map<string, LeadWithRequests["requests"]>();
  for (const r of requests) {
    const list = byLead.get(r.lead_id) ?? [];
    list.push({
      resource_title: r.resource_title,
      requested_at: r.requested_at,
      opted_in_this_request: Boolean(r.opted_in_this_request),
    });
    byLead.set(r.lead_id, list);
  }

  return leads.map((row) => ({ ...toLead(row), requests: byLead.get(row.id) ?? [] }));
}

export function getLeadStats() {
  const db = getDb();
  const totalLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads`).get() as { c: number }).c;
  const optIns = (
    db.prepare(`SELECT COUNT(*) as c FROM leads WHERE updates_opt_in = 1`).get() as { c: number }
  ).c;
  const totalRequests = (
    db.prepare(`SELECT COUNT(*) as c FROM resource_requests`).get() as { c: number }
  ).c;
  return { totalLeads, optIns, totalRequests };
}
