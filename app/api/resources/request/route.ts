import { NextResponse } from "next/server";
import { getPublishedResourceBySlug, captureLeadAndRequestResource } from "@/lib/resources/queries";
import { clean, EMAIL_REGEX } from "@/lib/validation";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: a hidden field real visitors never fill in. Bots that fill
  // every field trip it — we pretend success without creating a lead.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true, downloadUrl: null });
  }

  const name = clean(body.name, 150);
  const city = clean(body.city, 150);
  const email = clean(body.email, 200);
  const resourceSlug = clean(body.resourceSlug, 200);
  const updatesOptIn = body.updatesOptIn === true;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  // City is required for every *new* submission per product direction, but
  // the `leads.city` column itself stays nullable — pre-existing rows saved
  // before this requirement (if any) are never rejected or rewritten on
  // read, only new inserts are held to it here.
  if (!city) fieldErrors.city = "City is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!resourceSlug) fieldErrors.resourceSlug = "Missing resource.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  // Publication state is checked here, at request time — an unpublished
  // (or since-unpublished) resource can never be requested.
  const resource = await getPublishedResourceBySlug(resourceSlug);
  if (!resource) {
    return NextResponse.json({ error: "This resource is not available." }, { status: 404 });
  }

  let request;
  try {
    ({ request } = await captureLeadAndRequestResource({
      name,
      email,
      city: city || null,
      updates_opt_in: updatesOptIn,
      resource_id: resource.id,
    }));
  } catch (error) {
    console.error("Resource request capture failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // The public link only ever carries this opaque request id — never the
  // real storage path or filename.
  const downloadUrl = `/api/resources/download?token=${request.id}`;

  return NextResponse.json({ success: true, downloadUrl, name });
}
