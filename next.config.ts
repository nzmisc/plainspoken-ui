import type { NextConfig } from "next";
import { INDEXABLE } from "./lib/site";

const devHosts = () => (process.env.DEV_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Other hostnames the dev server is reached by (a tunnel, a tailnet name), comma-separated in
  // DEV_HOSTS, e.g. in .env.local; only matters in `next dev`
  allowedDevOrigins: devHosts(),
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
    return [
      // The shadcn CLI and other registries' tooling fetch items cross-origin
      { source: "/r/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      // Kept out of search engines (see INDEXABLE): the header reaches what a meta tag can't, like
      // Storybook's static files and the registry's JSON
      ...(INDEXABLE ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ];
  },
};

export default nextConfig;
