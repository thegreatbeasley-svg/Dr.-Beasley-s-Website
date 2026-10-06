# Dr. Virgil Beasly — Site Architecture (Local Demo)

A working local demo of the architectural foundation for Dr. Virgil Beasly's brand and authority
site: a resource library, a knowledge hub, reader Q&A, books/body-of-work, related projects, and
contact — all backed by a local SQLite database with a simple admin area to manage every section.
Everything runs on this computer only — there is no live deployment, external database, or
outbound email, and no payment processing.

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS v4) and a local SQLite database
(better-sqlite3). No paid or external service is required to run it. This repo is also a local git
repository (`git log`) — not pushed anywhere — used purely as a safety net while building; nothing
is connected to GitHub, Vercel, Supabase, or any other service.

## Quick start

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

The first time the server starts, it creates the local database and seeds a small amount of
clearly-labeled demonstration content per section (see "What's seeded" below). This happens once,
per table, in `instrumentation.ts` → `lib/seed.ts` — it never touches a table that already has
rows, so it's safe to restart repeatedly without duplicating or resetting anything.

For a production-like run instead of the dev server:

```bash
npm run build
npm run start
```

Both `npm run dev` and `npm run start` explicitly bind to `127.0.0.1` (see `package.json`) — the
server is reachable only from this machine. `next start` binds to all interfaces by default, so
this is intentionally overridden.

## Admin access (local demo login — not production authentication)

Visit **http://localhost:3000/admin**.

Credentials come from `.env.local` (copy `.env.example` if you don't have one yet):

- Username: `admin`
- Password: `beasly-demo-2026`

Change these in `.env.local` any time — they take effect on the next server start. Sessions are
opaque random tokens stored server-side in SQLite and handed to the browser as an httpOnly cookie;
every admin page and every mutation/export API route re-checks that session server-side on each
request (see `lib/admin/session.ts`).

**This is explicitly a demo login, not production-grade auth.** No password hashing at rest, no
account system, no rate limiting, no HTTPS. See "Production work remaining" below.

## Public site map

| Page | What it is |
| --- | --- |
| `/` | Hero, brief intro, 3 featured resources, body-of-work highlights, a featured reader question, related projects, final CTA |
| `/about` | Bio/experience/philosophy/personal — currently draft placeholder sections, pending approved copy |
| `/knowledge` | The full browsing hub: published resources (downloadable PDFs) *and* articles (on-page content), filterable by type |
| `/knowledge/[slug]` | An individual article page |
| `/resources/[slug]` | An individual resource's detail page + the request/download form (also reachable via a card on `/knowledge`) |
| `/questions` | Published reader Q&A + a submission form (new questions start in a moderation queue) |
| `/questions/[slug]` | An individual published question + answer |
| `/books` | Books, frameworks, research, programmes — info and a call to action only, no purchasing yet |
| `/books/[slug]` | An individual book/body-of-work entry |
| `/projects` | Related initiatives, each with Dr. Beasly's relationship to it stated explicitly |
| `/projects/[slug]` | An individual project |
| `/contact` | Speaking / collaboration / media / general enquiry form — no invented contact details |
| `/privacy` | Draft-labeled placeholder privacy structure, not a reviewed policy, excluded from the sitemap/indexing |

## Admin sections

Every content type below follows the same pattern: a list with **Published**/**Featured** toggles,
a **New** form, and an **Edit** form. Uploads (PDFs, cover images) are validated by real file
content, written under a fresh server-generated filename, and never placed in a public folder
directly.

- **Resources** (`/admin/resources`) — PDF + optional cover upload, the original content type.
- **Articles** (`/admin/articles`) — on-page Knowledge Hub content (article/guide/video/publication).
- **Questions** (`/admin/questions`) — moderation queue. A submitted question is **always**
  `pending`; nothing in the codebase publishes one automatically. Review it, write an answer, and
  set status to Published (or Rejected) — only then does it appear on `/questions`. The
  submitter's email is shown only here, never on any public page.
- **Books** (`/admin/books`) — kind, availability status, and an optional CTA label/link. Stripe
  fields exist in the schema (`price_cents`, `stripe_price_id`) but are unused.
- **Projects** (`/admin/projects`) — name, a relationship note (defaults to an explicit draft
  placeholder — never auto-filled with an assumed description), optional external link.
- **Leads** (`/admin/leads`) — every resource-request submission, with CSV export.
- **Enquiries** (`/admin/enquiries`) — every contact-form submission, with CSV export.

## How the core visitor flow works (resource requests)

1. `/knowledge` and `/` link out to each resource's own `/resources/[slug]` page.
2. The request form requires **name, city, and email** (all three — city was previously optional
   in an earlier build of this demo and has been corrected). The updates checkbox is optional and
   unchecked by default; checking it never silently subscribes someone who left it unchecked on a
   later visit, but an earlier opt-in is never silently revoked either.
3. Submitting saves the lead and request to SQLite and returns a **working local download link** —
   no email is sent.
4. The download link carries only an opaque request id, never the real file path. Hitting it
   re-checks that the resource is still published before serving the file, so unpublishing a
   resource invalidates previously issued links immediately.

Sample resources/articles are placeholder content generated at seed time and are clearly marked as
demonstration content in the UI (and, for PDFs, inside the file itself). They are not authored by,
or attributed to, Dr. Virgil Beasly.

## What's seeded on first run

Each content type is seeded independently and only if its own table is still empty — admin-created
content, or content you've already published/edited, is never touched or duplicated by a restart:

- **Resources**: 3 published (one marked Featured) + 1 left unpublished, to demonstrate the
  publish/unpublish behavior.
- **Articles**: 2 published demo articles.
- **Projects**: the two entries named in the architecture brief — *Continuum Wellness by Carolyn*
  and *Continuum Lifestyle* — seeded **unpublished**, with the relationship note left as the draft
  placeholder. Nothing about the relationship is asserted; an admin must confirm it and publish.
- **Questions** and **Books**: intentionally seeded with zero rows. No fake Q&A and no invented
  book titles — these sections show a graceful empty state until real content exists.

## Where the data lives

Everything is local and gitignored — none of it is committed, even to the local git repo:

| What | Where |
| --- | --- |
| Database (all content types, leads, enquiries, admin sessions) | `data/app.db` (SQLite, WAL mode) |
| Uploaded resource PDFs (gated, never public) | `private-storage/resources/` |
| Uploaded cover images (resources/articles/books) | `public/uploads/covers/` |
| Admin credentials & site URL | `.env.local` |

Gated PDF files are served only through `/api/resources/download`, after a request has been
recorded — never placed under `public/` or linked to directly.

## Resetting the demo

This deletes all content, leads, enquiries, uploaded files, and admin sessions. It's a deliberate
action — nothing resets automatically:

```bash
rm -rf data private-storage public/uploads
```

Restart the server afterward; it will recreate the database and reseed the demo content described
above.

## Architecture notes (for the next phase)

- **Service boundaries**: every content type has its own `lib/<domain>/queries.ts` (and
  `types.ts`); pages and components never touch SQLite directly. This is the whole seam for a
  later swap — `lib/db.ts` → a hosted Postgres client (e.g. Supabase), `lib/resources/storage.ts`
  → durable object storage, `lib/admin/session.ts` → a real auth provider.
- **Schema migrations are additive only**: `lib/db.ts`'s `migrate()` uses
  `CREATE TABLE IF NOT EXISTS` for new tables, and a small `ensureColumn()` helper for adding a
  column to a table that already exists from an earlier run (plain `CREATE TABLE IF NOT EXISTS`
  does *not* alter an existing table — this was actually hit and fixed during this build; see git
  history, "Stage D" commit). Nothing here ever drops or rewrites existing data.
- **SEO foundation**: `lib/seo.ts` centralizes the site URL and canonical/OG metadata; every public
  page sets its own `metadata`/`generateMetadata`. `app/sitemap.ts` and `app/robots.ts` list only
  published content and exclude `/admin` and `/api`. `Article` and `QAPage` JSON-LD are emitted on
  knowledge articles and published questions — factual fields only, no invented credentials.

## Verification performed

- `npm run build`, `npx tsc --noEmit`, and `npx eslint .` all pass cleanly on the current code.
- Full route sweep: every public page and every admin page (both unauthenticated-redirected and
  authenticated-200) returns the expected status.
- Full resource request → download flow re-verified end to end after the city-required change.
- Full question submit → admin moderation (answer + publish) → public visibility flow verified,
  including that the honeypot silently drops bot submissions and that the submitter's email never
  appears on any public page.
- Admin CRUD (create/edit/publish-toggle/feature-toggle) exercised for Articles, Books, and
  Projects via the API, each confirmed to appear/disappear from its public page accordingly.
- Contact form submission → admin enquiries list + CSV export verified.
- A real schema-drift bug (an added column silently not applying to an already-existing table) was
  caught during this build's own verification and fixed with the `ensureColumn()` migration helper
  described above — re-verified afterward with no data loss.
- Restart persistence re-verified across every content type (resources, articles, questions,
  books, projects, leads, enquiries) with an exact before/after row-count comparison.
- Desktop (1280px) and mobile (390px) rendering checked with a headless-browser screenshot pass
  across the new public pages; the original resource-request modal's keyboard focus-trap fix (see
  git history) remains in place on `/resources/[slug]`.

Not verified: automated cross-browser testing (only Chromium was available in this environment)
and a full screen-reader pass (only headless-browser accessibility-tree checks were run).

## What remains draft (no facts invented)

- **About** page sections (biography, credentials, philosophy, personal) are structural
  placeholders only.
- **Projects**: the two seeded entries are unpublished; their relationship to Dr. Beasly is an
  explicit draft placeholder, not a description.
- **Privacy** page is a draft structure, not a reviewed legal document, and is excluded from the
  sitemap/indexing.
- **Contact** page states plainly that direct contact details aren't published yet.
- **Books**: no entries are seeded (no titles to invent); the section works, but is empty until an
  admin adds real entries.
- **Questions**: no Q&A is seeded; the first real answer comes from an admin reviewing a real
  submission.

## Production work remaining

This is a local demo. Before this becomes a real, deployed site, at minimum:

- **Authentication**: replace the env-var username/password with real hashed credentials or a
  hosted auth provider (e.g. Supabase Auth, as used in the reference implementation), HTTPS-only
  cookies, and rate limiting on the login route.
- **Database**: swap SQLite for Supabase Postgres (or similar) if the site needs multiple app
  instances or concurrent write load beyond a single-server demo. `lib/db.ts` is the seam.
- **File storage**: move uploads to durable object storage (Supabase Storage, S3, etc.) instead of
  the local filesystem. `lib/resources/storage.ts` is the seam.
- **Email**: connect a real transactional email provider — nothing is emailed anywhere in this
  build, by design (resource delivery, question-submission confirmations, contact-form receipts).
- **Content**: replace all draft/placeholder copy across About, Projects, Privacy, Books, and
  Questions with approved material once supplied and reviewed.
- **Payments**: Stripe-backed paid books are explicitly out of scope for this phase; the `books`
  table has reserved, unused columns for it.
- **Deployment**: DNS, hosting (e.g. Vercel), and a production environment file with real secrets —
  none of which exist yet, by design, for this local-only demo. The local git history here is not
  connected to any remote.

### What we'll need from you for the next phase

Nothing has been connected yet — these are just what the above items will eventually need:

- Supabase project (or equivalent) — database + storage + auth, once you're ready to move off SQLite/local files.
- A domain/subdomain and Vercel (or chosen host) access for deployment.
- A transactional email provider (e.g. Resend, as used in the reference project) + a sending domain.
- Stripe account, when book payments are ready to go live.
- Approved copy for About, Projects (confirm the Continuum relationship before publishing), Books,
  and a reviewed Privacy policy.

## Handoff files preserved

`CLAUDE-CODE-PROMPT.md`, `WEBSITE-COPY.md`, `START-HERE.md`, and `assets/` are unchanged from the
original handoff. `THREAD-HANDOVER.md` is a living handover note, updated at the end of each
working session — read it first when picking this project back up.
