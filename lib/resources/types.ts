export const RESOURCE_TYPES = ["Guide", "Worksheet", "Book", "Other"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type Resource = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  resource_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  cover_image_path: string | null;
  is_demo_content: boolean;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ResourceRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  resource_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  cover_image_path: string | null;
  is_demo_content: number;
  published: number;
  featured: number;
  created_at: string;
  updated_at: string;
};

export function toResource(row: ResourceRow): Resource {
  return {
    ...row,
    is_demo_content: Boolean(row.is_demo_content),
    published: Boolean(row.published),
    featured: Boolean(row.featured),
  };
}

export type Lead = {
  id: string;
  name: string;
  city: string | null;
  email: string;
  updates_opt_in: boolean;
  updates_opt_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadRow = Omit<Lead, "updates_opt_in"> & { updates_opt_in: number };

export function toLead(row: LeadRow): Lead {
  return { ...row, updates_opt_in: Boolean(row.updates_opt_in) };
}

export type ResourceRequest = {
  id: string;
  lead_id: string;
  resource_id: string;
  opted_in_this_request: boolean;
  requested_at: string;
};

export type LeadWithRequests = Lead & {
  requests: { resource_title: string; requested_at: string; opted_in_this_request: boolean }[];
};

export type ResourceWithRequestCount = Resource & { request_count: number };
