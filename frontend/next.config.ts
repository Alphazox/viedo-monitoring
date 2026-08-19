import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean runtime image for the multi-stage Dockerfile — copies only the
  // traced production dependency subset instead of full node_modules.
  // Vercel does its own function bundling/tracing and doesn't expect
  // standalone-mode output (its build step fails looking for a
  // next-server.js.nft.json that standalone mode doesn't produce in the
  // same place), so skip it there — Vercel sets VERCEL=1 during builds.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
