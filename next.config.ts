import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.tapimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
