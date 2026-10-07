import type { Metadata } from "next";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PRE_LAUNCH_NOINDEX } from "@/lib/seo";

// Fallback only — every public route under app/(site) sets its own
// specific metadata via lib/seo.ts's buildMetadata(), including its own
// robots directive. This covers any route that doesn't (e.g. /admin),
// and "(Local Demo)" only ever describes this fallback title when the
// app is genuinely running the local SQLite backend — never on a hosted
// Supabase deployment (Preview or Production).
export async function generateMetadata(): Promise<Metadata> {
  const isLocalDemo = !isSupabaseConfigured();
  return {
    title: {
      default: isLocalDemo ? "Dr. Virgil Beasly (Local Demo)" : "Dr. Virgil Beasly",
      template: "%s",
    },
    description: isLocalDemo
      ? "A local, working demo site for Dr. Virgil Beasly."
      : "Dr. Virgil Beasly — Architect of a Life Well Lived.",
    // Belt-and-suspenders: every (site) route sets its own robots
    // directive via buildMetadata(), but this covers anything that
    // doesn't (e.g. /admin) while PRE_LAUNCH_NOINDEX is active.
    robots: PRE_LAUNCH_NOINDEX ? { index: false, follow: false } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-paper">{children}</body>
    </html>
  );
}
