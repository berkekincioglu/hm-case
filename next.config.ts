import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    domains: ["coin-images.coingecko.com", "assets.coingecko.com"],
  },
  // Exclude Lambda and CDK from Next.js build
  webpack: (config, { isServer }) => {
    // Ignore Lambda and CDK directories completely
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/lambda/**",
        "**/cdk/**",
        "**/cdk.out/**",
      ],
    };

    return config;
  },
  // Exclude from transpilation
  transpilePackages: [],
};

export default nextConfig;
