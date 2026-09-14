import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "gsap"],
  },
};

export default nextConfig;
