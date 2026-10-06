import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Virgil Beasly — Resource Library (Local Demo)",
  description:
    "A local, working demo of Dr. Virgil Beasly's resource library: browse free guides and request a download.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ink text-paper">{children}</body>
    </html>
  );
}
