export const DEFAULT_RELATIONSHIP_NOTE = "Draft — relationship to be confirmed.";

export type Project = {
  id: string;
  name: string;
  slug: string;
  relationship_note: string;
  description: string | null;
  url: string | null;
  logo_path: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = Omit<Project, "published" | "featured"> & {
  published: number;
  featured: number;
};

export function toProject(row: ProjectRow): Project {
  return { ...row, published: Boolean(row.published), featured: Boolean(row.featured) };
}
