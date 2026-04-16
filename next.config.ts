import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable file tracing to avoid ENOENT crash with Next.js 15 canary
  outputFileTracingIncludes: {},
  outputFileTracingExcludes: { "*": ["**"] },
};

export default nextConfig;
