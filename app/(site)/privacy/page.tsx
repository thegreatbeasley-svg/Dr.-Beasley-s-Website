import { buildMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Privacy — Dr. Virgil Beasly",
  description: "Draft privacy policy structure — not yet final.",
  path: "/privacy",
  index: false,
});

function buildSections(isLocalDemo: boolean) {
  return [
    {
      heading: "What this page is",
      body: "This is a placeholder structure for a privacy policy, not a final, reviewed legal document. Nothing on this page should be treated as a binding commitment.",
    },
    {
      heading: "What this site actually does today",
      body: isLocalDemo
        ? "Name, city, email, and consent choices submitted through this site's forms (resource requests, question submissions, contact enquiries) are saved to a local database on this machine only. No email is sent, no data is shared with any third party, and nothing is tracked beyond what's needed to run the form itself."
        : "Name, city, email, and consent choices submitted through this site's forms (resource requests, question submissions, contact enquiries) are saved to this site's database. No email is sent yet, no data is shared with any third party, and nothing is tracked beyond what's needed to run the form itself.",
    },
    {
      heading: "Data you submit",
      body: "[Draft — to be completed] What's collected, why, how long it's kept, and how someone can request its deletion.",
    },
    {
      heading: "Cookies & analytics",
      body: "[Draft — to be completed] This site does not currently use analytics or marketing cookies.",
    },
    {
      heading: "Contact about this policy",
      body: "[Draft — to be completed] A real privacy contact will be added once finalized.",
    },
  ];
}

export default function PrivacyPage() {
  const SECTIONS = buildSections(!isSupabaseConfigured());
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Draft</p>
      <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">Privacy</h1>
      <p className="mt-4 rounded-2xl border border-gold/20 bg-ink-elevated/60 p-5 text-sm leading-relaxed text-paper-muted">
        This is a draft structure only. It has not been reviewed as a final privacy policy and
        should not be relied on as one.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.heading}>
            <h2 className="text-lg font-medium text-paper">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
