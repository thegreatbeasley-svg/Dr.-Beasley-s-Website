import { NextResponse } from "next/server";
import { createEnquiry } from "@/lib/contact/queries";
import { ENQUIRY_TOPICS } from "@/lib/contact/types";
import { clean, EMAIL_REGEX } from "@/lib/validation";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const name = clean(body.name, 150);
  const email = clean(body.email, 200);
  const topic = clean(body.topic, 30);
  const message = clean(body.message, 4000);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!ENQUIRY_TOPICS.includes(topic as (typeof ENQUIRY_TOPICS)[number])) {
    fieldErrors.topic = "Choose a topic.";
  }
  if (!message) fieldErrors.message = "Enter a message.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  createEnquiry({ name, email, topic, message });
  return NextResponse.json({ success: true });
}
