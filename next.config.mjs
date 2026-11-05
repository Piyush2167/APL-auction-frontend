/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // REST calls go through this origin so the refresh-token cookie is first-party.
  // Socket.IO connects directly to NEXT_PUBLIC_SOCKET_URL (websockets cannot be proxied by Vercel).
  async rewrites() {
    return {
      // the landing page is static HTML built with the design kit in public/assets
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }],
    };
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};

export default nextConfig;
