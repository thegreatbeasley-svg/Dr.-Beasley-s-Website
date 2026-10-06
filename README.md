# Dr. Virgil Beasly — Resource Library (Local Demo)

A working local demo of a resource-hub landing page: visitors meet Dr. Virgil Beasly, browse free
guides/worksheets/books, and submit their name, city, and email to unlock a download. The owner
manages content and leads through a simple admin area. Everything runs on this computer only —
there is no live deployment, external database, or outbound email.

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS v4) and a local SQLite database
(better-sqlite3). No paid or external service is required to run it.

## Quick start

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

The first time the server starts, it automatically creates the local database and seeds four
sample resources (three published, one left as an unpublished draft so you can see that behavior
in the admin area). This happens in `instrumentation.ts` → `lib/seed.ts` and only runs once — it
checks whether the `resources` table is already populated.

For a production-like run instead of the dev server:

```bash
npm run build
npm run start
```

Both `npm run dev` and `npm run start` explicitly bind to `127.0.0.1` (see `package.json`) — the
server is reachable only from this machine, which is what a local-only demo should do. `next
start` binds to all interfaces by default, so this is intentionally overridden.

## Admin access (local demo login — not production authentication)

Visit **http://localhost:3000/admin**.

Credentials come from `.env.local` (copy `.env.example` if you don't have one yet):

- Username: `admin`
- Password: `beasly-demo-2026`

Change these in `.env.local` any time — they take effect on the next server start. Sessions are
opaque random tokens stored server-side in the SQLite database and handed to the browser as an
httpOnly cookie; every admin page and every mutation/export API route re-checks that session
server-side on each request (see `lib/admin/session.ts`).

**This is explicitly a demo login, not production-grade auth.** It has no password hashing at
rest, no account system, no rate limiting, and no HTTPS (the whole demo runs over plain
`http://localhost`). See "Production work remaining" below.

## What you can do in the admin area

- **Resources** (`/admin/resources`) — create a resource with a PDF upload and an optional cover
  image, edit any resource (including replacing its file or cover), and toggle **Published** and
  **Featured** with one click. Unpublished resources disappear from the public site and can no
  longer be requested, immediately.
- **Leads** (`/admin/leads`) — every name/city/email submission, its updates opt-in, and which
  resource(s) it requested. **Export CSV** downloads the full list; fields that could be
  interpreted as spreadsheet formulas are automatically escaped.

## How the visitor flow works

1. The homepage (`/`) shows the hero, a short "about" section, and the resource library.
2. Clicking a resource card opens an accessible modal (native `<dialog>`, focus-trapped, closes on
   Escape or a backdrop click) with the full description and the request form. Each resource also
   has its own shareable page at `/resources/[slug]` with the same content, for direct links.
3. Submitting the form (name + email required, city optional, updates checkbox unchecked by
   default) saves the lead and the request to SQLite and returns a **working local download
   link** — no email is sent.
4. The download link carries only an opaque request id, never the real file path. Hitting it
   re-checks that the resource is still published before serving the file, so unpublishing a
   resource invalidates previously issued links immediately.

Sample resources are placeholder PDFs generated at seed time and are clearly marked
"SAMPLE — DEMONSTRATION CONTENT" inside the file itself, in the UI, and in this README. They are
not authored by, or attributed to, Dr. Virgil Beasly.

## Where the data lives

Everything is local and gitignored — nothing here is committed to version control:

| What | Where |
| --- | --- |
| Database (resources, leads, requests, admin sessions) | `data/app.db` (SQLite, WAL mode) |
| Uploaded resource PDFs (gated, never public) | `private-storage/resources/` |
| Uploaded cover images | `public/uploads/covers/` |
| Admin credentials & site URL | `.env.local` |

Resource files are served only through `/api/resources/download`, after a request has been
recorded — they are never placed under `public/` or linked to directly.

## Resetting the demo

This deletes all resources, leads, requests, uploaded files, and admin sessions. It's a deliberate
action — nothing resets automatically:

```bash
rm -rf data private-storage public/uploads
```

Restart the server afterward; it will recreate the database and reseed the four sample resources.

## Verification performed

- `npm run build` completes cleanly (Turbopack production build, no errors).
- `npx tsc --noEmit` and `npx eslint .` both pass with no errors.
- Homepage, resource detail pages, and admin pages all render and return the expected content.
- Full lead-capture → local download flow tested end-to-end (valid PDF returned, correct headers).
- Field validation (missing name, invalid email) and the honeypot bot-trap both verified.
- Requesting an unpublished resource is rejected server-side even with a crafted request.
- Publishing/unpublishing a resource immediately changes what's visible on the public site and
  disables its download link — verified in both directions.
- CSV export escapes formula-injection payloads (`=`, `+`, `-`, `@`-prefixed values) — verified
  with a crafted lead name.
- Admin pages and mutation/export API routes both reject unauthenticated requests (redirect for
  pages, 401 JSON for APIs) and accept them after login.
- Data, uploaded files, and even the logged-in admin session all survive a full server restart.
- Desktop and mobile rendering checked with a headless-browser screenshot pass (1440px and
  390px-wide viewports).
- The resource modal was checked with a headless browser for keyboard accessibility: it traps
  Tab/Shift+Tab focus inside itself, closes on Escape and on a backdrop click, and exposes
  `aria-labelledby` pointing at its heading. An initial test found the browser's native `<dialog>`
  focus containment alone was not fully reliable, so a small manual focus-trap handler was added
  on top of it (see `app/components/resources/ResourceModal.tsx`) and re-verified.
- Uploads are validated by real file content (a PDF must start with `%PDF-`, not just have a
  matching extension/MIME type) and always written under a fresh server-generated filename, never
  the visitor's own filename.

Not verified: automated cross-browser testing (only Chromium was available in this environment)
and a full screen-reader pass (only headless-browser accessibility-tree checks were run).

## Production work remaining

This is a local demo. Before this becomes a real, deployed site, at minimum:

- **Authentication**: replace the env-var username/password with real hashed credentials or a
  hosted auth provider (e.g. Supabase Auth, as used in the reference implementation), HTTPS-only
  cookies, and rate limiting on the login route.
- **Database**: swap SQLite for a hosted database if the site needs multiple app instances or
  concurrent write load beyond a single-server demo. `lib/db.ts` is the single seam to change.
- **File storage**: move uploads to durable object storage (S3, Supabase Storage, etc.) instead of
  the local filesystem, so uploads survive redeploys and scale past one server. `lib/resources/
  storage.ts` is the seam to change.
- **Email**: connect a real transactional email provider to actually deliver the resource link
  and any opt-in confirmation — right now nothing is emailed, by design.
- **Content**: replace all draft copy and sample/placeholder PDFs with approved biographical copy
  and real resources once supplied and reviewed (see `WEBSITE-COPY.md`'s editorial note).
- **Payments**: Stripe-backed paid books are explicitly out of scope for this phase.
- **Deployment**: DNS, hosting, and a production environment file with real secrets — none of
  which exist yet, by design, for this local-only demo.

## Handoff files preserved

`CLAUDE-CODE-PROMPT.md`, `WEBSITE-COPY.md`, `START-HERE.md`, and `assets/` are unchanged from the
original handoff and are kept in the project root/`assets/` for reference.
