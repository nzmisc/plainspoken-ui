import type { MetadataRoute } from "next";
import { INDEXABLE, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Crawling is allowed either way, so crawlers can see the noindex (see INDEXABLE)
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: INDEXABLE ? `${siteUrl()}/sitemap.xml` : undefined,
  };
}
