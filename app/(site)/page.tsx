import Hero from "@/app/components/Hero";
import About from "@/app/components/About";
import FeaturedResources from "@/app/components/home/FeaturedResources";
import BodyOfWorkHighlights from "@/app/components/home/BodyOfWorkHighlights";
import FeaturedQuestion from "@/app/components/home/FeaturedQuestion";
import RelatedProjects from "@/app/components/home/RelatedProjects";
import FinalCta from "@/app/components/home/FinalCta";
import { listPublishedResources } from "@/lib/resources/queries";
import { listPublishedBooks } from "@/lib/books/queries";
import { listPublishedQuestions } from "@/lib/questions/queries";
import { listPublishedProjects } from "@/lib/projects/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Dr. Virgil Beasly",
  description:
    "Dr. Virgil Beasly's resource library and knowledge hub — guides, articles, books, and answers to reader questions.",
  path: "/",
});

function pickFeatured<T extends { featured: boolean }>(items: T[], count: number): T[] {
  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);
  return [...featured, ...rest].slice(0, count);
}

export default function HomePage() {
  const featuredResources = pickFeatured(listPublishedResources(), 3);
  const featuredBooks = pickFeatured(listPublishedBooks(), 3);
  const questions = listPublishedQuestions();
  const featuredProject = listPublishedProjects();

  return (
    <>
      <Hero />
      <About />
      <FeaturedResources resources={featuredResources} />
      <BodyOfWorkHighlights books={featuredBooks} />
      <FeaturedQuestion question={questions[0] ?? null} />
      <RelatedProjects projects={featuredProject.slice(0, 4)} />
      <FinalCta />
    </>
  );
}
