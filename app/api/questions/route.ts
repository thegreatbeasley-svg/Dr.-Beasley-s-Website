import { NextResponse } from "next/server";
import { submitQuestion } from "@/lib/questions/queries";
import { clean, EMAIL_REGEX } from "@/lib/validation";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot — same pattern as the resource request form.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const questionText = clean(body.questionText, 2000);
  const submitterName = clean(body.name, 150);
  const submitterEmail = clean(body.email, 200);

  const fieldErrors: Record<string, string> = {};
  if (!questionText) fieldErrors.questionText = "Enter your question.";
  if (!submitterEmail) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(submitterEmail)) fieldErrors.email = "Enter a valid email address.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  // Always lands in the moderation queue — see lib/questions/queries.ts.
  // Nothing here (or anywhere else) can publish a question automatically.
  submitQuestion({
    question_text: questionText,
    submitter_name: submitterName || null,
    submitter_email: submitterEmail,
  });

  return NextResponse.json({ success: true });
}
