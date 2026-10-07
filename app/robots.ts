import type { MetadataRoute } from "next";
import { SITE_URL, PRE_LAUNCH_NOINDEX } from "@/lib/seo";

/**
 * TEMPORARY LAUNCH GATE — mirrors PRE_LAUNCH_NOINDEX in lib/seo.ts. While
 * true, the entire site is disallowed for every crawler, even though it's
 * publicly reachable, because it hasn't been announced yet. Flip both
 * flags together at launch.
 */
export default function robots(): MetadataRoute.Robots {
  if (PRE_LAUNCH_NOINDEX) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
