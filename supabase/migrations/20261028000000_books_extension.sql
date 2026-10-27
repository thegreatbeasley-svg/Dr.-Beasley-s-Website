-- Books extension: subtitle, long description, publication year, display order,
-- free-form retailer links, cover dimensions and an optional promo video
-- (plus the storage bucket that uploaded videos live in).
--
-- ADDITIVE AND IDEMPOTENT — safe to run more than once. Nothing is dropped,
-- renamed or rewritten: every existing column, row, RLS policy and storage
-- object is left exactly as it is. Existing code keeps working unchanged
-- after this runs (it only ever reads/writes the original columns).
--
-- Not applied automatically. Review, then run once in the Supabase SQL editor
-- (or `supabase db push`). Run it BEFORE deploying the code that reads the new
-- columns.

begin;

-- New columns -------------------------------------------------------------

alter table public.books add column if not exists subtitle text;
alter table public.books add column if not exists long_description text;
alter table public.books add column if not exists publication_year integer;
alter table public.books add column if not exists sort_order integer not null default 0;
alter table public.books add column if not exists retailers jsonb not null default '[]'::jsonb;
alter table public.books add column if not exists cover_width integer;
alter table public.books add column if not exists cover_height integer;
-- Optional promo video: 'upload' (public URL in the book-videos bucket), or a
-- normalized YouTube/Vimeo watch URL. Both null when the book has no video.
alter table public.books add column if not exists video_source text;
alter table public.books add column if not exists video_url text;

-- Sanity constraints --------------------------------------------------------
-- `add constraint` has no IF NOT EXISTS, so each one is guarded by a catalog
-- lookup. All four are satisfied by every pre-existing row (new columns are
-- null / '[]'), so adding them cannot fail on existing data.
--
-- Retailer name/URL rules (free-text name, https-only public URL) and video URL
-- validation (YouTube/Vimeo only) are enforced in the application, not here: a
-- CHECK cannot sensibly express them and all writes go through the server after
-- an admin check.

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'books_publication_year_range' and conrelid = 'public.books'::regclass) then
    alter table public.books add constraint books_publication_year_range
      check (publication_year is null or publication_year between 1000 and 2100);
  end if;

  if not exists (select 1 from pg_constraint
                 where conname = 'books_retailers_shape' and conrelid = 'public.books'::regclass) then
    alter table public.books add constraint books_retailers_shape
      check (jsonb_typeof(retailers) = 'array' and jsonb_array_length(retailers) <= 20);
  end if;

  if not exists (select 1 from pg_constraint
                 where conname = 'books_cover_dimensions' and conrelid = 'public.books'::regclass) then
    alter table public.books add constraint books_cover_dimensions
      check ((cover_width is null) = (cover_height is null)
         and (cover_width is null or (cover_width > 0 and cover_height > 0)));
  end if;

  if not exists (select 1 from pg_constraint
                 where conname = 'books_video_consistent' and conrelid = 'public.books'::regclass) then
    alter table public.books add constraint books_video_consistent
      check ((video_source is null) = (video_url is null)
         and (video_source is null or video_source in ('upload', 'youtube', 'vimeo')));
  end if;
end
$$;

-- Storage bucket for uploaded promo videos ------------------------------------
-- Public (like cover-images: the files are served straight to visitors), MP4
-- only, 50 MB per file — the per-file ceiling of Supabase's free plan. If the
-- project is on a paid plan the limit can be raised here and in
-- MAX_VIDEO_BYTES (lib/books/video.ts). Idempotent; touches no other bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-videos', 'book-videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- One-time ordering backfill ------------------------------------------------
-- Gives any pre-existing rows a sort_order that reproduces today's public
-- order (featured first, then newest first), so nothing visibly reshuffles.
-- Runs only while every row still has the default 0, so re-running the file —
-- or running it after the admin has reordered books — never overwrites an order.

with ranked as (
  select id, row_number() over (order by featured desc, created_at desc, id) as rn
  from public.books
)
update public.books b
   set sort_order = r.rn
  from ranked r
 where b.id = r.id
   and not exists (select 1 from public.books where sort_order <> 0);

commit;

-- Indexes: none added. The table holds a handful of rows; a sort over it is
-- free, and an index would only add maintenance.
--
-- RLS: unchanged and sufficient. The existing policy
--   "published books are public" ... for select using (published)
-- is row-level, so it covers the new columns automatically: anonymous clients
-- can read the new fields of PUBLISHED rows only, and drafts stay invisible.
-- There is still no insert/update/delete policy, so only the server's
-- service-role client can write.
--
-- Storage: covers continue to use the existing public `cover-images` bucket
-- (5 MB limit; png/jpeg/webp). Promo videos use the new public `book-videos`
-- bucket created above. Storage RLS: no policies are added — uploads are made
-- through server-minted signed upload URLs and reads of a public bucket don't
-- need a policy, exactly as for cover-images.
--
-- Rollback (destructive — only if ever needed; discards data in these columns):
--   alter table public.books
--     drop constraint if exists books_publication_year_range,
--     drop constraint if exists books_retailers_shape,
--     drop constraint if exists books_cover_dimensions,
--     drop constraint if exists books_video_consistent,
--     drop column if exists subtitle, drop column if exists long_description,
--     drop column if exists publication_year, drop column if exists sort_order,
--     drop column if exists retailers, drop column if exists cover_width,
--     drop column if exists cover_height, drop column if exists video_source,
--     drop column if exists video_url;
--   (and, once its objects are removed:  delete from storage.buckets where id = 'book-videos';)
