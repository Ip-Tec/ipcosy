import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ipcosy/ip-socket", "@ipcosy/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
