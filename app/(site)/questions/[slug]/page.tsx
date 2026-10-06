import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedQuestionBySlug } from "@/lib/questions/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = await getPublishedQuestionBySlug(slug);
  if (!question) {
    return buildMetadata({ title: "Not found", description: "", path: `/questions/${slug}`, index: false });
  }
  return buildMetadata({
    title: `${question.question_text} — Dr. Virgil Beasly`,
    description: question.answer_body?.slice(0, 160) ?? question.question_text,
    path: `/questions/${question.slug}`,
  });
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const question = await getPublishedQuestionBySlug(slug);
  if (!question) notFound();

  const paragraphs = (question.answer_body ?? "").split(/\n{2,}/).filter((p) => p.trim());

  // Minimal, factual QAPage structured data — only the submitted question
  // text and the admin-written answer, nothing invented.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question.question_text,
      acceptedAnswer: {
        "@type": "Answer",
        text: question.answer_body ?? "",
      },
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Link href="/questions" className="text-sm font-medium text-gold underline-offset-4 hover:underline">
        &larr; Back to Questions &amp; Answers
      </Link>

      <h1 className="mt-8 text-2xl font-medium text-paper sm:text-3xl">{question.question_text}</h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-paper">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
