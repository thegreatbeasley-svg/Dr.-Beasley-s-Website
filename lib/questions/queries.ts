import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { Question, PublishedQuestion, QuestionStatus } from "./types";

function nowIso() {
  return new Date().toISOString();
}

function isSlugTaken(slug: string, excludeId?: string): boolean {
  const db = getDb();
  const row = excludeId
    ? db.prepare(`SELECT id FROM questions WHERE slug = ? AND id != ?`).get(slug, excludeId)
    : db.prepare(`SELECT id FROM questions WHERE slug = ?`).get(slug);
  return Boolean(row);
}

function uniqueSlugFrom(text: string, excludeId?: string): string {
  const base = slugify(text).slice(0, 80) || "question";
  let candidate = base;
  let suffix = 1;
  while (isSlugTaken(candidate, excludeId)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

// ============================================================
// PUBLIC
// ============================================================

export function listPublishedQuestions(): PublishedQuestion[] {
  return getDb()
    .prepare(
      `SELECT id, question_text, answer_body, slug, answered_at, created_at
       FROM questions WHERE status = 'published' ORDER BY answered_at DESC`
    )
    .all() as PublishedQuestion[];
}

export function getPublishedQuestionBySlug(slug: string): PublishedQuestion | null {
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
export function submitQuestion(input: SubmitQuestionInput): Question {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  getDb()
    .prepare(
      `INSERT INTO questions (id, question_text, submitter_name, submitter_email, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    )
    .run(id, input.question_text, input.submitter_name ?? null, input.submitter_email, timestamp);
  return getQuestionById(id)!;
}

// ============================================================
// ADMIN
// ============================================================

export function listAllQuestionsAdmin(): Question[] {
  return getDb().prepare(`SELECT * FROM questions ORDER BY created_at DESC`).all() as Question[];
}

export function getQuestionById(id: string): Question | null {
  const row = getDb().prepare(`SELECT * FROM questions WHERE id = ?`).get(id) as
    | Question
    | undefined;
  return row ?? null;
}

export type AnswerQuestionInput = {
  answer_body: string | null;
  status: QuestionStatus;
};

export function updateQuestionAnswer(id: string, input: AnswerQuestionInput): Question {
  const existing = getQuestionById(id);
  if (!existing) throw new Error("Question not found");

  const db = getDb();
  let slug = existing.slug;
  let answeredAt = existing.answered_at;

  if (input.status === "published") {
    if (!slug) slug = uniqueSlugFrom(existing.question_text, id);
    if (!answeredAt) answeredAt = nowIso();
  }

  db.prepare(
    `UPDATE questions SET answer_body = ?, status = ?, slug = ?, answered_at = ? WHERE id = ?`
  ).run(input.answer_body, input.status, slug, answeredAt, id);

  return getQuestionById(id)!;
}

export function getQuestionStats() {
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
