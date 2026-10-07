import SiteHeader from "@/app/components/layout/SiteHeader";
import Footer from "@/app/components/Footer";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Shared chrome for every public-facing page (home, about, knowledge,
 * questions, books, projects, contact, privacy, resource detail pages).
 * A route group — it adds no path segment, so e.g. `(site)/page.tsx` is
 * still served at `/`. `/admin/*` is a sibling tree with its own
 * `AdminShell` layout and never sees this header/footer.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const isLocalDemo = !isSupabaseConfigured();
  return (
    <>
      <SiteHeader isLocalDemo={isLocalDemo} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer isLocalDemo={isLocalDemo} />
    </>
  );
}
