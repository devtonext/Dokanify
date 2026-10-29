import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
  allowedDevOrigins: [
    "3000-6484f7f85e829cb7.monkeycode-ai.live",
    ".monkeycode-ai.live",
    "*.monkeycode-ai.live",
  ],
};

export default nextConfig;
