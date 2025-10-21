import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    domains: ["coin-images.coingecko.com", "assets.coingecko.com"],
  },
};

export default nextConfig;
