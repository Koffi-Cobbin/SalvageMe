/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Swap to real CDN/media domains when the Django backend is live.
    remotePatterns: [{ protocol: "https", hostname: "**.salvageme-media.example.com" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
};
export default nextConfig;
