import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The dev server is also previewed over the tailnet (tailscale serve); only matters in `next dev`
  allowedDevOrigins: ["dev-box.example.ts.net"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Storybook is static files in public/storybook; its index needs the file name so its relative URLs resolve
    return [
      { source: "/storybook", destination: "/storybook/index.html", permanent: false },
      { source: "/r", destination: "/r/registry.json", permanent: false },
    ];
  },
  async headers() {
    // The shadcn CLI and other registries' tooling fetch items cross-origin
    return [{ source: "/r/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
};

export default nextConfig;
