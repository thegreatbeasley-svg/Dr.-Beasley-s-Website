import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Dr. Virgil Beasley | Architect of a Life Well Lived",
  description:
    "Psychologist, author, entrepreneur and prostate cancer survivor. Dr. Virgil Beasley on love, loss, recovery, aging, and the architecture of a life well lived.",
  path: "/about",
});

const proseClass = "space-y-6 text-base leading-[1.8] text-paper-muted sm:text-lg sm:leading-[1.8]";
const h2Class = "text-balance font-display text-2xl font-medium leading-snug text-paper sm:text-3xl";
const emphasisClass = "font-display text-xl italic leading-relaxed text-paper sm:text-2xl";
const titleClass = "font-display italic text-gold";

/** Short gold rule that opens each thematic section. */
function Rule() {
  return <span aria-hidden="true" className="block h-px w-12 bg-gold" />;
}

export default function AboutPage() {
  return (
    <>
      {/* 1 — Hero / introduction */}
      <section aria-labelledby="about-heading" className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-tangerine/15 blur-[140px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-gold/10 blur-[130px]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-16 lg:py-24">
          <div>
            <Rule />
            <p className="mt-5 text-xs font-semibold tracking-[0.35em] text-gold uppercase">
              About Dr. Virgil Beasley
            </p>
            <p className="mt-4 font-display text-base italic text-gold/90 sm:text-lg">
              Architect of a Life Well Lived
            </p>
            <h1
              id="about-heading"
              className="mt-6 max-w-3xl text-balance text-3xl font-medium leading-[1.15] text-paper sm:text-4xl md:text-5xl"
            >
              I&rsquo;ve Spent My Life Understanding People. Then Life Gave Me a Few Lessons of Its Own.
            </h1>
            <div className={`mt-8 max-w-2xl ${proseClass}`}>
              <p className="text-paper">
                I&rsquo;m Dr. Virgil Beasley. I&rsquo;m a psychologist, author, entrepreneur, and prostate
                cancer survivor. For more than three decades, I&rsquo;ve dedicated much of my professional
                life to understanding people: what drives us, what holds us back, how we connect, and how
                we navigate the changes life places in front of us.
              </p>
              <p>But professional knowledge and personal experience are two very different teachers.</p>
              <p>
                I&rsquo;ve spent years helping people navigate difficult transitions, rebuild relationships,
                rediscover confidence, and find meaning in unexpected circumstances. Then prostate cancer
                brought some of those questions into my own life.
              </p>
              <p>
                Suddenly, the subjects I&rsquo;d spent decades studying weren&rsquo;t simply professional
                interests. They were part of my personal reality.
              </p>
              <p>
                And that experience changed the way I think about recovery, relationships, aging, and what
                it really means to live well.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="relative mx-auto aspect-[4/5] w-64 overflow-hidden rounded-[2.5rem] ring-1 ring-gold/40 shadow-[0_0_60px_-10px_rgba(226,121,58,0.35)] sm:w-72 lg:w-80">
              <Image
                src="/dr-virgil-beasly-portrait.jpg"
                alt="Portrait of Dr. Virgil Beasley, wearing an orange shirt, against a dark background"
                fill
                priority
                sizes="(min-width: 1024px) 320px, 288px"
                className="object-cover object-[50%_20%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Love, loss, and the things that really matter */}
      <section aria-labelledby="love-loss-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
          <Rule />
          <h2 id="love-loss-heading" className={`mt-6 ${h2Class}`}>
            Love, Loss, and the Things That Really Matter
          </h2>
          <div className={`mt-8 ${proseClass}`}>
            <p>
              For 43 years, I shared my life with my wife, Carol Ann Beasley. Our marriage taught me things
              about love, partnership, vulnerability, and intimacy that no textbook ever could.
            </p>
            <p>
              We built a life together, experienced its joys and challenges, and learned that meaningful
              relationships are not defined by perfection. They&rsquo;re shaped by the countless ways we
              choose to show up for one another.
            </p>
            <p>
              Carol Ann passed away a few years ago. Losing her brought another dimension to my
              understanding of what it means to love deeply, to grieve, and to continue living with
              purpose.
            </p>
            <p>That experience remains part of who I am and how I approach my work today.</p>
            <p>
              After decades studying human relationships, I&rsquo;ve come to believe that intimacy is much
              bigger than sexuality. It&rsquo;s about being known, understood, accepted, and connected to
              another person.
            </p>
            <p className={emphasisClass}>
              And those connections are among the things that make life worth living.
            </p>
          </div>
        </div>
      </section>

      {/* 3 — When surviving is only the beginning */}
      <section
        aria-labelledby="surviving-heading"
        className="border-b border-white/10 bg-gradient-to-b from-ink-elevated/50 to-ink"
      >
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
          <Rule />
          <h2 id="surviving-heading" className={`mt-6 ${h2Class}`}>
            When Surviving Is Only the Beginning
          </h2>
          <div className={`mt-8 ${proseClass}`}>
            <p>
              I&rsquo;ve faced prostate cancer myself, and I understand that surviving an illness and
              recovering your sense of self are not always the same thing.
            </p>
            <p>
              Cancer treatment can change your body, your confidence, your sexuality, and the way you
              relate to the people closest to you. Even when the medical news is encouraging, the
              emotional and relational challenges may continue.
            </p>
            <p>
              My personal experience, combined with decades of psychological practice, led me to focus
              much of my work on helping men and couples navigate intimacy and relationships after
              prostate cancer.
            </p>
            <p>
              That work has produced two books, <em className={titleClass}>Sex After Prostate Cancer</em>{" "}
              and <em className={titleClass}>From Despair to Repair</em>, along with practical guides such
              as{" "}
              <Link
                href="/resources/finding-your-new-normal"
                className="underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
              >
                <em className={titleClass}>Finding Your New Normal</em>
              </Link>{" "}
              and{" "}
              <Link
                href="/resources/relationship-rescue-a-simple-guide-to-reconnecting-after-prostate-cancer"
                className="underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold"
              >
                <em className={titleClass}>Relationship Rescue</em>
              </Link>
              .
            </p>
            <p>
              Through these resources, I explore the emotional realities of recovery, the pressures
              surrounding sexual performance, and the opportunities to rediscover intimacy, confidence, and
              connection.
            </p>
            <p>My message is not that everything can return to the way it was.</p>
            <p className="text-paper">
              It&rsquo;s that a meaningful, fulfilling life remains possible, even when the circumstances
              have changed.
            </p>
            <p className={emphasisClass}>
              Sometimes the most important work isn&rsquo;t restoring the past. It&rsquo;s building what
              comes next.
            </p>
          </div>
        </div>
      </section>

      {/* 4 — Rethinking how we live and age */}
      <section
        aria-labelledby="aging-heading"
        className="relative overflow-hidden border-b border-white/10 bg-ink-elevated"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-24">
          <Rule />
          <h2 id="aging-heading" className={`mt-6 ${h2Class}`}>
            Rethinking How We Live and Age
          </h2>
          <div className={`mt-8 ${proseClass}`}>
            <p>
              Psychology has been central to my life, but I&rsquo;ve never believed that understanding
              people should stop at the walls of a consulting room.
            </p>
            <p>
              I&rsquo;ve also spent years involved in entrepreneurship, business development, and projects
              designed to challenge conventional thinking.
            </p>
            <p>
              One of those initiatives is Continuum Lifestyle, part of a broader vision for rethinking how
              people move through the different stages of life.
            </p>
            <p>
              As someone who is now navigating the realities of aging myself, I have a personal interest in
              this question: Why do we so often treat growing older as a process of gradually surrendering
              independence, dignity, and choice?
            </p>
            <p className="text-paper">I believe we can do better.</p>
            <p>
              The Continuum projects explore alternatives to traditional approaches to senior living, with
              an emphasis on maintaining independence, preserving dignity, supporting meaningful
              connections, and helping people remain active participants in their own lives.
            </p>
            <p>
              The ambition is not simply to make aging more comfortable. It&rsquo;s to challenge the
              assumptions behind how society organizes later life.
            </p>
            <p className={emphasisClass}>
              Because getting older shouldn&rsquo;t mean becoming less visible, less valuable, or less
              capable of shaping your own future.
            </p>
          </div>
        </div>
      </section>

      {/* 5 — The architecture of a life well lived */}
      <section aria-labelledby="architecture-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
          <Rule />
          <h2 id="architecture-heading" className={`mt-6 ${h2Class}`}>
            The Architecture of a Life Well Lived
          </h2>
          <div className={`mt-8 ${proseClass}`}>
            <p>
              Looking back, I can see a common thread running through my work as a psychologist, my
              writing, my entrepreneurial ventures, and my personal experiences.
            </p>
            <p>It&rsquo;s the belief that life is something we continue to build.</p>
            <p>
              Sometimes we build with confidence and excitement. Sometimes illness, loss, or unexpected
              circumstances force us to reconsider everything we thought we knew.
            </p>
            <p>
              And sometimes we have to design a different future from the one we originally imagined.
            </p>
            <p>
              Being an <em className={titleClass}>Architect of a Life Well Lived</em> isn&rsquo;t about
              having all the answers. It&rsquo;s about remaining curious, making conscious choices,
              nurturing meaningful relationships, and refusing to believe that our best possibilities
              necessarily belong to the past.
            </p>
            <p>
              Whether I&rsquo;m writing about intimacy after prostate cancer, exploring new approaches to
              aging, or developing projects that challenge established ways of doing things, the underlying
              question remains the same.
            </p>
          </div>

          <blockquote className="my-12 border-l-2 border-gold pl-6 sm:pl-8">
            <p className="text-balance font-display text-2xl font-semibold leading-snug text-paper sm:text-3xl">
              How do we create a life worth living, whatever stage of life we&rsquo;re in?
            </p>
          </blockquote>

          <div className={proseClass}>
            <p>
              I don&rsquo;t pretend to have a perfect answer. But after decades of professional practice,
              entrepreneurship, love, loss, survival, and a fair amount of reinvention, I believe
              it&rsquo;s a question worth spending a lifetime exploring.
            </p>
          </div>
        </div>
      </section>

      {/* 6 — Welcome to the conversation */}
      <section aria-labelledby="welcome-heading" className="bg-ink-elevated/30">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
          <Rule />
          <h2 id="welcome-heading" className={`mt-6 ${h2Class}`}>
            Welcome to the Conversation
          </h2>
          <div className={`mt-8 ${proseClass}`}>
            <p>
              This website brings together the different parts of my work and the ideas that continue to
              interest me.
            </p>
            <p>
              You&rsquo;ll find books, articles, practical guides, questions from readers, and projects
              exploring how we can live more fully.
            </p>
            <p>
              Some of what I share comes from research and professional experience. Some comes from
              personal experience. And some comes from a lifelong curiosity about what human beings are
              capable of becoming.
            </p>
            <p>
              I hope you&rsquo;ll find something here that makes you think, helps you through a difficult
              moment, or opens a possibility you hadn&rsquo;t considered.
            </p>
            <p className="font-display text-xl font-semibold text-paper sm:text-2xl">
              Welcome. I&rsquo;m glad you&rsquo;re here.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center rounded-full bg-tangerine px-8 py-4 text-center text-sm font-semibold uppercase tracking-widest text-tangerine-ink transition-colors hover:bg-tangerine-hover"
            >
              Explore the Knowledge Hub
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
