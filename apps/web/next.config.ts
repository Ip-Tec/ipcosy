import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ipcosy/ip-socket", "@ipcosy/db"],
};

export default nextConfig;
