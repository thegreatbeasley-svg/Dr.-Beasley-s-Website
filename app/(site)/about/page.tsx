import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About — Dr. Virgil Beasly",
  description: "About Dr. Virgil Beasly — draft structure, pending approved biographical copy.",
  path: "/about",
});

const SECTIONS = [
  {
    heading: "Biography",
    body: "[Draft — pending approved copy] A verified biography will replace this placeholder. No career history, qualifications, or personal background should be inferred from this page yet.",
  },
  {
    heading: "Experience & credentials",
    body: "[Draft — pending approved copy] Credentials and professional experience will be listed here once supplied and confirmed.",
  },
  {
    heading: "Philosophy & approach",
    body: "[Draft — pending approved copy] A description of approach and ways of working will go here.",
  },
  {
    heading: "Beyond the work",
    body: "[Draft — pending approved copy] A more personal note will go here once approved.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">About</p>
      <h1 className="mt-5 text-3xl font-medium text-paper sm:text-4xl">Welcome. I&rsquo;m Dr. Virgil Beasly.</h1>
      <p className="mt-6 text-lg leading-relaxed text-paper-muted">
        I&rsquo;m glad you&rsquo;re here. This space brings together resources for you to read,
        reflect on, and return to. Browse the collection, choose something that interests you, and
        take your next step with a resource you can keep.
      </p>

      <p className="mt-8 rounded-2xl border border-gold/20 bg-ink-elevated/60 p-5 text-sm leading-relaxed text-paper-muted">
        The sections below are placeholder structure for the full About page. They&rsquo;re drafts,
        not a verified biography — no credentials, achievements, or history should be inferred from
        them until approved copy is supplied.
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
