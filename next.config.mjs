/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // FileForge (the backend's file-storage service) serves listing photos
    // from a CDN host not fixed in API_REFERENCE.md's examples (it shows a
    // placeholder "cdn.example"). Wildcarding https here so real uploads
    // aren't blocked by next/image's allowlist — tighten this to the exact
    // FileForge CDN hostname once confirmed (flagged as a follow-up).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
};
export default nextConfig;
