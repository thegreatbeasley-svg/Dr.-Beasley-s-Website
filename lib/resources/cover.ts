/**
 * Pure, client-safe helper — deliberately kept out of storage.ts (which
 * is "server-only" and touches the filesystem) so components that just
 * need to render a cover <img src> don't pull fs/crypto into the client
 * bundle.
 */
export function getResourceCoverUrl(resource: {
  cover_image_path: string | null;
  title: string;
  resource_type: string;
}) {
  if (resource.cover_image_path) return resource.cover_image_path;
  const params = new URLSearchParams({ title: resource.title, type: resource.resource_type });
  return `/api/resources/cover?${params.toString()}`;
}
