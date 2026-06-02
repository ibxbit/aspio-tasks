import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root so Next 16 doesn't pick up ancestor lockfiles.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
