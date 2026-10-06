import type { Metadata } from "next";
import "./globals.css";

// Fallback only — every public route under app/(site) sets its own
// specific metadata via lib/seo.ts's buildMetadata(). This covers any
// route that doesn't (e.g. /admin).
export const metadata: Metadata = {
  title: {
    default: "Dr. Virgil Beasly (Local Demo)",
    template: "%s",
  },
  description: "A local, working demo site for Dr. Virgil Beasly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-paper">{children}</body>
    </html>
  );
}
