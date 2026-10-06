import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap, unwrapNullable } from "@/lib/supabase/admin";
import type { Question, PublishedQuestion, QuestionStatus } from "./types";

function nowIso() {
  return new Date().toISOString();
}

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    let query = createSupabaseAdminClient().from("questions").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const row = unwrapNullable(await query.maybeSingle());
    return Boolean(row);
  }
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM questions WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM questions WHERE slug = ?`).get(slug);
  return Boolean(row);
}

async function uniqueSlugFrom(text: string, excludeId?: string): Promise<string> {
  const base = slugify(text).slice(0, 80) || "question";
  let candidate = base;
  let suffix = 1;
  while (await isSlugTaken(candidate, excludeId)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

// ============================================================
// PUBLIC
// ============================================================

export async function listPublishedQuestions(): Promise<PublishedQuestion[]> {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient()
        .from("questions")
        .select("id, question_text, answer_body, slug, answered_at, created_at")
        .eq("status", "published")
        .order("answered_at", { ascending: false })
    ) as PublishedQuestion[];
    return rows;
  }
  return getDb()
    .prepare(
      `SELECT id, question_text, answer_body, slug, answered_at, created_at
       FROM questions WHERE status = 'published' ORDER BY answered_at DESC`
    )
    .all() as PublishedQuestion[];
}

export async function getPublishedQuestionBySlug(slug: string): Promise<PublishedQuestion | null> {
  if (isSupabaseConfigured()) {
    const row = unwrapNullable(
      await createSupabaseAdminClient()
        .from("questions")
        .select("id, question_text, answer_body, slug, answered_at, created_at")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle()
    ) as PublishedQuestion | null;
    return row;
  }
  const row = getDb()
    .prepare(
      `SELECT id, question_text, answer_body, slug, answered_at, created_at
       FROM questions WHERE slug = ? AND status = 'published'`
    )
    .get(slug) as PublishedQuestion | undefined;
  return row ?? null;
}

export type SubmitQuestionInput = {
  question_text: string;
  submitter_name?: string | null;
  submitter_email: string;
};

/**
 * Always lands in 'pending' — there is no code path anywhere in this app
 * that sets a question straight to 'published'. An admin must explicitly
 * write an answer and change the status (see updateQuestionAnswer).
 */
export async function submitQuestion(input: SubmitQuestionInput): Promise<Question> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("questions")
        .insert({
          id,
          question_text: input.question_text,
          submitter_name: input.submitter_name ?? null,
          submitter_email: input.submitter_email,
          status: "pending",
          created_at: timestamp,
        })
        .select()
    );
    return (await getQuestionById(id))!;
  }

  getDb()
    .prepare(
      `INSERT INTO questions (id, question_text, submitter_name, submitter_email, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    )
    .run(id, input.question_text, input.submitter_name ?? null, input.submitter_email, timestamp);
  return (await getQuestionById(id))!;
}

// ============================================================
// ADMIN
// ============================================================

export async function listAllQuestionsAdmin(): Promise<Question[]> {
  if (isSupabaseConfigured()) {
    return unwrap(
      await createSupabaseAdminClient().from("questions").select("*").order("created_at", { ascending: false })
    ) as Question[];
  }
  return getDb().prepare(`SELECT * FROM questions ORDER BY created_at DESC`).all() as Question[];
}

export async function getQuestionById(id: string): Promise<Question | null> {
  if (isSupabaseConfigured()) {
    return unwrapNullable(
      await createSupabaseAdminClient().from("questions").select("*").eq("id", id).maybeSingle()
    ) as Question | null;
  }
  const row = getDb().prepare(`SELECT * FROM questions WHERE id = ?`).get(id) as
    | Question
    | undefined;
  return row ?? null;
}

export type AnswerQuestionInput = {
  answer_body: string | null;
  status: QuestionStatus;
};

export async function updateQuestionAnswer(id: string, input: AnswerQuestionInput): Promise<Question> {
  const existing = await getQuestionById(id);
  if (!existing) throw new Error("Question not found");

  let slug = existing.slug;
  let answeredAt = existing.answered_at;

  if (input.status === "published") {
    if (!slug) slug = await uniqueSlugFrom(existing.question_text, id);
    if (!answeredAt) answeredAt = nowIso();
  }

  if (isSupabaseConfigured()) {
    unwrap(
      await createSupabaseAdminClient()
        .from("questions")
        .update({ answer_body: input.answer_body, status: input.status, slug, answered_at: answeredAt })
        .eq("id", id)
        .select()
    );
    return (await getQuestionById(id))!;
  }

  getDb()
    .prepare(
      `UPDATE questions SET answer_body = ?, status = ?, slug = ?, answered_at = ? WHERE id = ?`
    )
    .run(input.answer_body, input.status, slug, answeredAt, id);

  return (await getQuestionById(id))!;
}

export async function getQuestionStats() {
  if (isSupabaseConfigured()) {
    const rows = unwrap(
      await createSupabaseAdminClient().from("questions").select("status")
    ) as { status: string }[];
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    return {
      pending: byStatus.get("pending") ?? 0,
      published: byStatus.get("published") ?? 0,
      rejected: byStatus.get("rejected") ?? 0,
    };
  }
  const db = getDb();
  const counts = db
    .prepare(`SELECT status, COUNT(*) as count FROM questions GROUP BY status`)
    .all() as { status: string; count: number }[];
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]));
  return {
    pending: byStatus.pending ?? 0,
    published: byStatus.published ?? 0,
    rejected: byStatus.rejected ?? 0,
  };
}
