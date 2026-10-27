/**
 * Which remote cover images next/image may optimize: only this project's
 * public Supabase `cover-images` bucket. Shared by next.config.ts and the
 * BookCover component so the two can never disagree.
 */
const COVER_PATH_PREFIX = "/storage/v1/object/public/cover-images/";

function supabaseOrigin(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** For next.config.ts `images.remotePatterns`. Empty when Supabase isn't configured. */
export function coverRemotePatterns() {
  const origin = supabaseOrigin();
  if (!origin) return [];
  return [
    {
      protocol: origin.protocol.replace(":", "") as "http" | "https",
      hostname: origin.hostname,
      port: origin.port,
      pathname: `${COVER_PATH_PREFIX}**`,
    },
  ];
}

/** True when next/image may optimize `src` (local upload, or our own Supabase bucket). */
export function isOptimizableCoverSrc(src: string): boolean {
  if (src.startsWith("/")) return !src.startsWith("//");
  const origin = supabaseOrigin();
  if (!origin) return false;
  try {
    const url = new URL(src);
    return url.origin === origin.origin && url.pathname.startsWith(COVER_PATH_PREFIX);
  } catch {
    return false;
  }
}
