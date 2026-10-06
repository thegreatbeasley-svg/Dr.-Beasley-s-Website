import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap, unwrapNullable } from "@/lib/supabase/admin";
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

export async function listPublishedResources(): Promise<Resource[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("resources")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
    ) as ResourceRow[];
    return rows.map(toResource);
  }
  const rows = getDb()
    .prepare(
      `SELECT * FROM resources WHERE published = 1
       ORDER BY featured DESC, created_at DESC`
    )
    .all() as ResourceRow[];
  return rows.map(toResource);
}

export async function getPublishedResourceBySlug(slug: string): Promise<Resource | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient()
        .from("resources")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
    ) as ResourceRow | null;
    return row ? toResource(row) : null;
  }
  const row = getDb()
    .prepare(`SELECT * FROM resources WHERE slug = ? AND published = 1`)
    .get(slug) as ResourceRow | undefined;
  return row ? toResource(row) : null;
}

// ============================================================
// RESOURCES — admin
// ============================================================

export async function listAllResourcesAdmin(): Promise<ResourceWithRequestCount[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const rows = unwrap(
      await supabase.from("resources").select("*").order("created_at", { ascending: false })
    ) as ResourceRow[];
    const requestRows = unwrap(
      await supabase.from("resource_requests").select("resource_id")
    ) as { resource_id: string }[];
    const countMap = new Map<string, number>();
    for (const r of requestRows) countMap.set(r.resource_id, (countMap.get(r.resource_id) ?? 0) + 1);
    return rows.map((row) => ({ ...toResource(row), request_count: countMap.get(row.id) ?? 0 }));
  }
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

export async function getResourceById(id: string): Promise<Resource | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient().from("resources").select("*").eq("id", id).maybeSingle()
    ) as ResourceRow | null;
    return row ? toResource(row) : null;
  }
  const row = getDb().prepare(`SELECT * FROM resources WHERE id = ?`).get(id) as
    | ResourceRow
    | undefined;
  return row ? toResource(row) : null;
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from("resources").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const row = unwrapNullable(await query.maybeSingle());
    return Boolean(row);
  }
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM resources WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM resources WHERE slug = ?`).get(slug);
  return Boolean(row);
}

// Re-exported for backward compatibility with existing importers
// (app/api/admin/resources/*) — the implementation now lives in
// lib/slug.ts so every content domain shares it.
export { slugify } from "@/lib/slug";

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

export async function createResource(input: ResourceInput): Promise<Resource> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("resources")
        .insert({
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
          is_demo_content: input.is_demo_content !== false,
          published: Boolean(input.published),
          featured: Boolean(input.featured),
          created_at: timestamp,
          updated_at: timestamp,
        })
        .select()
    );
    return (await getResourceById(id))!;
  }

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
  return (await getResourceById(id))!;
}

export type ResourceUpdateInput = Partial<ResourceInput>;

export async function updateResource(id: string, input: ResourceUpdateInput): Promise<Resource> {
  const existing = await getResourceById(id);
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
    is_demo_content: input.is_demo_content !== undefined ? input.is_demo_content : existing.is_demo_content,
    published: input.published !== undefined ? input.published : existing.published,
    featured: input.featured !== undefined ? input.featured : existing.featured,
    updated_at: nowIso(),
  };

  if (isSupabaseConfigured()) {
    unwrap(await createSupabaseAdminClient().from("resources").update(merged).eq("id", id).select());
    return (await getResourceById(id))!;
  }

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
    .run({
      ...merged,
      is_demo_content: merged.is_demo_content ? 1 : 0,
      published: merged.published ? 1 : 0,
      featured: merged.featured ? 1 : 0,
      id,
    });

  return (await getResourceById(id))!;
}

export async function replaceResourceFile(resourceId: string, fileName: string, size: number) {
  const existing = await getResourceById(resourceId);
  if (!existing) throw new Error("Resource not found");
  await updateResource(resourceId, { file_path: fileName, file_name: fileName, file_size: size });
  await deleteResourceFile(existing.file_path);
}

export async function replaceCoverImage(resourceId: string, coverPath: string) {
  const existing = await getResourceById(resourceId);
  if (!existing) throw new Error("Resource not found");
  await updateResource(resourceId, { cover_image_path: coverPath });
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
export async function captureLeadAndRequestResource(input: CaptureLeadInput): Promise<{
  lead: Lead;
  request: { id: string; requested_at: string };
}> {
  if (isSupabaseConfigured()) {
    // Single Postgres function call — see supabase/schema.sql's
    // capture_lead_and_request() for why this needs to be atomic in a way
    // two sequential REST calls over a network can't guarantee.
    const result = unwrap(
      await createSupabaseAdminClient().rpc("capture_lead_and_request", {
        p_name: input.name,
        p_email: input.email.toLowerCase(),
        p_city: input.city ?? null,
        p_opt_in: input.updates_opt_in,
        p_resource_id: input.resource_id,
      })
    ) as { lead_id: string; request_id: string; requested_at: string };

    const leadRow = unwrap(
      await createSupabaseAdminClient().from("leads").select("*").eq("id", result.lead_id).single()
    ) as LeadRow;

    return {
      lead: toLead(leadRow),
      request: { id: result.request_id, requested_at: result.requested_at },
    };
  }

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

export async function getResourceRequestWithResource(requestId: string) {
  if (isSupabaseConfigured()) {
    const request = unwrapNullable(
      await createSupabaseAdminClient()
        .from("resource_requests")
        .select("id, resource_id")
        .eq("id", requestId)
        .maybeSingle()
    ) as { id: string; resource_id: string } | null;
    if (!request) return null;
    const resource = await getResourceById(request.resource_id);
    if (!resource) return null;
    return { request, resource };
  }
  const db = getDb();
  const request = db
    .prepare(`SELECT * FROM resource_requests WHERE id = ?`)
    .get(requestId) as { id: string; resource_id: string } | undefined;
  if (!request) return null;
  const resource = await getResourceById(request.resource_id);
  if (!resource) return null;
  return { request, resource };
}

// ============================================================
// LEADS — admin
// ============================================================

export async function listLeadsAdmin(): Promise<LeadWithRequests[]> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const leads = unwrap(
      await supabase.from("leads").select("*").order("created_at", { ascending: false })
    ) as LeadRow[];
    if (leads.length === 0) return [];

    const [requestResult, resourceResult] = await Promise.all([
      supabase
        .from("resource_requests")
        .select("lead_id, requested_at, opted_in_this_request, resource_id")
        .order("requested_at", { ascending: true }),
      supabase.from("resources").select("id, title"),
    ]);
    const requestRows = unwrap(requestResult) as {
      lead_id: string;
      requested_at: string;
      opted_in_this_request: boolean;
      resource_id: string;
    }[];
    const resourceRows = unwrap(resourceResult) as { id: string; title: string }[];
    const titleById = new Map(resourceRows.map((r) => [r.id, r.title]));

    const byLead = new Map<string, LeadWithRequests["requests"]>();
    for (const r of requestRows) {
      const list = byLead.get(r.lead_id) ?? [];
      list.push({
        resource_title: titleById.get(r.resource_id) ?? "",
        requested_at: r.requested_at,
        opted_in_this_request: Boolean(r.opted_in_this_request),
      });
      byLead.set(r.lead_id, list);
    }
    return leads.map((row) => ({ ...toLead(row), requests: byLead.get(row.id) ?? [] }));
  }

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

export async function getLeadStats() {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdminClient();
    const [{ count: totalLeads }, { count: optIns }, { count: totalRequests }] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("updates_opt_in", true),
      supabase.from("resource_requests").select("*", { count: "exact", head: true }),
    ]);
    return { totalLeads: totalLeads ?? 0, optIns: optIns ?? 0, totalRequests: totalRequests ?? 0 };
  }
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
