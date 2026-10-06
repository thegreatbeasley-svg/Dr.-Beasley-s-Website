import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import type { ContactEnquiry } from "./types";

export type CreateEnquiryInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export function createEnquiry(input: CreateEnquiryInput): ContactEnquiry {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO contact_enquiries (id, name, email, topic, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.name, input.email, input.topic, input.message, createdAt);
  return { id, name: input.name, email: input.email, topic: input.topic, message: input.message, created_at: createdAt };
}

export function listEnquiriesAdmin(): ContactEnquiry[] {
  return getDb()
    .prepare(`SELECT * FROM contact_enquiries ORDER BY created_at DESC`)
    .all() as ContactEnquiry[];
}
