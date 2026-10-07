import Link from "next/link";

const PATHWAYS = [
  {
    number: "01",
    title: "Understand More Deeply",
    description:
      "Psychology, intimacy and the inner patterns that shape how we relate to ourselves and one another.",
    href: "/knowledge",
  },
  {
    number: "02",
    title: "Live More Fully",
    description:
      "Resilience, wellbeing, ageing and the choices that allow life to remain rich with possibility.",
    href: "/knowledge",
  },
  {
    number: "03",
    title: "Build What Should Exist",
    description:
      "Ideas, businesses and initiatives created around what life could become—not merely what it is today.",
    href: "/projects",
  },
];

export default function ThePathways() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">The Work</p>
          <h2 className="mt-3 text-3xl font-medium text-paper sm:text-4xl">
            A life explored from many directions
          </h2>
          <p className="mt-5 text-base leading-relaxed text-paper-muted">
            Psychology, intimacy, resilience, enterprise and the continuing possibility of
            becoming—different expressions of one enduring concern: how we might live more fully.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {PATHWAYS.map((pathway) => (
            <Link
              key={pathway.title}
              href={pathway.href}
              className="group block border-t border-white/10 pt-6 transition-colors hover:border-gold/40"
            >
              <span className="font-display text-sm text-gold/70">{pathway.number}</span>
              <h3 className="mt-3 text-xl font-medium text-paper transition-colors group-hover:text-gold">
                {pathway.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-paper-muted">{pathway.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
