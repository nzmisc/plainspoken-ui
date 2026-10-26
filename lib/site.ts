// Where this copy of the site lives, for absolute links: registry item URLs in install commands,
// dependencies between registry items, canonical URLs. No imports, so scripts can use it too.

export const SITE_NAME = "plainspoken-ui";
export const REPO_URL = "https://github.com/nzmisc/plainspoken-ui";
export const REGISTRY_NAMESPACE = "@plainspoken";

/**
 * Whether search engines may index the site. While false, every response carries an
 * `X-Robots-Tag: noindex, nofollow` header (Storybook and the registry's JSON included), every page
 * a robots meta tag, and robots.txt names no sitemap. Crawling stays allowed: a crawler kept out by
 * robots.txt never sees the noindex, and can still list a page it finds linked elsewhere.
 */
export const INDEXABLE = false;

/**
 * NEXT_PUBLIC_SITE_URL when set (local previews set it); on Vercel, the production domain for
 * production builds and the branch URL for the rest; else localhost.
 */
export function siteUrl(): string {
  const env = process.env;
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (env.VERCEL_BRANCH_URL) return `https://${env.VERCEL_BRANCH_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** The JSON a shadcn CLI fetches for an item: https://…/r/button.json */
export function registryItemUrl(name: string): string {
  return `${siteUrl()}/r/${name}.json`;
}
