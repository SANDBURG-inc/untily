import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "untily-s3.s3.ap-northeast-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
