import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, unwrap } from "@/lib/supabase/admin";
import type { ContactEnquiry } from "./types";

export type CreateEnquiryInput = { name: string; email: string; topic: string; message: string };

export async function createEnquiry(input: CreateEnquiryInput): Promise<ContactEnquiry> {
  const row = { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    return unwrap(
      await createSupabaseAdminClient().from("contact_enquiries").insert(row).select().single()
    ) as ContactEnquiry;
  }
  getDb()
    .prepare(`INSERT INTO contact_enquiries (id,name,email,topic,message,created_at) VALUES (?,?,?,?,?,?)`)
    .run(row.id, row.name, row.email, row.topic, row.message, row.created_at);
  return row;
}

export async function listEnquiriesAdmin(): Promise<ContactEnquiry[]> {
  if (isSupabaseConfigured()) {
    return unwrap(
      await createSupabaseAdminClient()
        .from("contact_enquiries")
        .select("*")
        .order("created_at", { ascending: false })
    ) as ContactEnquiry[];
  }
  return getDb().prepare(`SELECT * FROM contact_enquiries ORDER BY created_at DESC`).all() as ContactEnquiry[];
}
