import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "plus.unsplash.com",
      "localhost",
      "storage.googleapis.com",
    ],
  },
};

export default nextConfig;
