import Hero from "@/app/components/Hero";
import About from "@/app/components/About";
import Footer from "@/app/components/Footer";
import Library from "@/app/components/resources/Library";
import { listPublishedResources } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const resources = listPublishedResources();

  return (
    <>
      <main className="flex-1">
        <Hero />
        <About />
        <Library resources={resources} />
      </main>
      <Footer />
    </>
  );
}
