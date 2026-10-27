import type { NextConfig } from "next";
import { coverRemotePatterns } from "./lib/books/cover-hosts";

const nextConfig: NextConfig = {
  images: {
    // Book covers live in the project's public Supabase `cover-images` bucket.
    remotePatterns: coverRemotePatterns(),
  },
};

export default nextConfig;
