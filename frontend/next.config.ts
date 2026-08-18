import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean runtime image for the multi-stage Dockerfile — copies only the
  // traced production dependency subset instead of full node_modules.
  output: "standalone",
};

export default nextConfig;
