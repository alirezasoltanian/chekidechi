import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // compiler: {
  //   removeConsole: process.env.NODE_ENV == "production",
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgflip.com",
      },
    ],
  },
  experimental: {
    // inlineCss: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",

  serverExternalPackages: ["grammy"],
};

export default nextConfig;
