import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { createProject, isProjectSlugTaken } from "@/lib/projects/queries";
import { slugify } from "@/lib/slug";
import { clean } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = clean(formData.get("name"), 200);
  const slugInput = clean(formData.get("slug"), 200);
  const relationshipNote = clean(formData.get("relationship_note"), 500);
  const description = clean(formData.get("description"), 2000);
  const url = clean(formData.get("url"), 500);
  const published = formData.get("published") === "true";
  const featured = formData.get("featured") === "true";

  const slug = slugify(slugInput || name);

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  if (!slug) errors.slug = "Slug is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (isProjectSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  const project = createProject({
    name,
    slug,
    relationship_note: relationshipNote || undefined,
    description: description || null,
    url: url || null,
    published,
    featured,
  });

  return NextResponse.json({ success: true, project });
}
