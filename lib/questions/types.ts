export const QUESTION_STATUSES = ["pending", "published", "rejected"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export type Question = {
  id: string;
  question_text: string;
  submitter_name: string | null;
  /** Admin-only — never rendered on any public page. */
  submitter_email: string;
  status: QuestionStatus | string;
  answer_body: string | null;
  slug: string | null;
  created_at: string;
  answered_at: string | null;
};

/** Public-safe projection — no submitter contact details. */
export type PublishedQuestion = Pick<
  Question,
  "id" | "question_text" | "answer_body" | "slug" | "answered_at" | "created_at"
>;
