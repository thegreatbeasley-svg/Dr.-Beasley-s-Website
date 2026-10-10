export default async function DeletedBanner({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string | string[] }>;
}) {
  const { deleted } = await searchParams;
  const name = Array.isArray(deleted) ? deleted[0] : deleted;
  if (!name) return null;
  return (
    <p role="status" className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-paper">
      &ldquo;{name.slice(0, 200)}&rdquo; was permanently deleted.
    </p>
  );
}
