# Claude Code implementation prompt

Build and verify a polished, working LOCAL demo for Dr. Virgil Beasly. Implement the actual application files, not just a plan.

## Working directory and references

Create the app in this directory:
/Users/martin/Documents/S-SENS Mentor/Clients/Dr. Beasley/Website/Landing Page

Inspect existing files first; preserve this handoff and assets. Read applicable AGENTS.md instructions.

Read-only reference implementation:
/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site

Inspect its resource pages, signup flow, admin UI, authentication, resource storage and lead export. Reuse appropriate patterns, but do not modify that project, copy credentials, connect to its database, or reuse its branding or personal content. Follow the installed framework version’s documentation.

## Project purpose

Create a stylish resource hub for visitors arriving from social media. It will eventually live on a subdomain alongside an existing website. Visitors meet Dr. Virgil Beasly, scroll through free resources, and submit name, city and email to download a resource. The owner manages content and leads through a simple admin area. Paid books with Stripe are a later phase.

Always spell the public name Dr. Virgil Beasly. The folder spelling is not the public brand.

## Approved direction and draft copy

Read WEBSITE-COPY.md in this directory and use its proposed introduction and interface copy. It is a draft for review, not a verified biography. Do not invent credentials, clinical specialties, personal history, testimonials, authorship or treatment claims. Keep all copy centrally editable.

Hero introduction:
“Welcome to Dr. Virgil Beasly’s resource library. Explore a growing collection of guides, books, and practical resources, gathered in one place for you to discover at your own pace.”

About introduction:
“I’m glad you’re here. This space brings together resources for you to read, reflect on, and return to. Browse the collection below, choose something that interests you, and take your next step with a resource you can keep.”

## Visual design and supplied portrait

Use the actual supplied photo at assets/dr-virgil-beasly-portrait.jpg. Copy it to the app’s public assets as needed, preserving the original. Do not generate a replacement face or modify his appearance.

Use CSS object-fit/object-position for a tasteful head-and-shoulders or upper-body crop. Prefer a softly rounded portrait panel on desktop with a fine muted-gold border and restrained orange glow; a circular or rounded crop on mobile is acceptable if it preserves the face. Keep some orange shirt visible. The photo’s black background should blend into the page. Provide meaningful alt text.

Palette: near-black backgrounds, warm-white text, muted gold details, tangerine primary buttons. Generous whitespace, refined typography, clear contrast, subtle motion with reduced-motion support. Avoid excessive decorative effects. Make the mobile experience excellent.

Hero: portrait, name, draft introduction, Explore free resources scroll button.
Library: attractive covers, type labels, short descriptions, filtering when useful, resource calls to action.
Footer: brand and clearly identified demo information. Do not invent contact details or legal promises.

## Working visitor flow

Create landing page, resource detail page or accessible modal, and required name/city/email form with validation. Include a separate unchecked optional updates checkbox. Save the lead, consent choice and resource request before returning a working local download. Do not send real emails. Clearly explain the demo’s local-only storage and lack of email delivery.

Create a few useful sample downloadable PDFs explicitly marked demonstration content, with sample covers. Do not imply they are authored by Dr. Beasly. Free guides, worksheets and books are initial resource types. Interactive surveys and paid checkout are future capabilities, not fake working buttons.

Serve downloadable files through a controlled server route after a successful request; do not place gated uploads in a public folder. Check publication state when handling requests. Use opaque request identifiers. Do not claim this demo prevents link sharing.

## Working local admin

Provide clearly labeled local demo login with server-side session checks on admin pages AND mutation/export endpoints. Document access details. Bind the server to localhost and explicitly distinguish demo authentication from production readiness.

Admin must support creating/editing resources, uploading PDFs and optional covers, descriptions and types, publish/unpublish, featured status, lead list with name/city/email/consent/requested resources, and CSV export.

Persist resources, leads, requests and uploads locally across restarts, preferably with SQLite or another reliable local store. Keep private data/uploads out of version control. Validate type and size of uploads, generate safe server-side filenames, prevent path traversal, escape spreadsheet formulas in CSV and render user content safely. Unpublished resources must be absent from public pages and unavailable to new requests.

## Scope and architecture

Prefer Next.js/TypeScript if appropriate given the reference. Keep storage, email and payment boundaries replaceable for later production setup. Avoid copying unrelated assessments or business-specific functionality.

No deployment, DNS changes, external database, production credentials, Stripe connection or real email sending. No required paid service. Use local fonts or robust system fallbacks if remote font access would block the demo.

## Verify and deliver

Start the app locally. Verify desktop/mobile rendering with browser tools if available, keyboard navigation and accessible dialogs, required field validation, successful lead persistence and download, admin editing/upload/publishing, hidden unpublished resources, restart persistence and safe CSV export. Run the production build. Fix failures and accurately report any unverified checks.

Create README.md with startup instructions, local preview URL, admin access, data locations, reset instructions that require deliberate user action, and remaining production work. Finish with a concise summary and working localhost link.
