import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/session";
import { getProjectById, isProjectSlugTaken, updateProject } from "@/lib/projects/queries";
import { slugify } from "@/lib/slug";
import { clean } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getProjectById(id);
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: { published?: boolean; featured?: boolean } = {};
  if (typeof body.published === "boolean") patch.published = body.published;
  if (typeof body.featured === "boolean") patch.featured = body.featured;

  const project = await updateProject(id, patch);
  return NextResponse.json({ success: true, project });
}

export async function PUT(req: Request, { params }: Context) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getProjectById(id);
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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

  if (await isProjectSlugTaken(slug, id)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  const project = await updateProject(id, {
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
