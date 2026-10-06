import Hero from "@/app/components/Hero";
import About from "@/app/components/About";
import Library from "@/app/components/resources/Library";
import { listPublishedResources } from "@/lib/resources/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Dr. Virgil Beasly — Resource Library (Local Demo)",
  description:
    "A local, working demo of Dr. Virgil Beasly's resource library: browse free guides and request a download.",
  path: "/",
});

// Note: this still renders the full library grid, same as before this
// stage. Stage E trims this to a 3-item featured teaser once /knowledge
// (Stage B) exists as the full browsing destination — see THREAD-HANDOVER
// / plan notes for the staged order.
export default function HomePage() {
  const resources = listPublishedResources();

  return (
    <>
      <Hero />
      <About />
      <Library resources={resources} />
    </>
  );
}
