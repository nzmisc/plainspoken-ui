import { POSTS } from "@/content/blog/posts";
import { AUTHOR, href } from "@/content/blog/site";
import { siteUrl } from "@/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** RFC 822 dates, as RSS wants them. Posts go out at 08:00 UTC on their date. */
const rfc822 = (date: string) => new Date(`${date}T08:00:00Z`).toUTCString();

/** The blog's RSS 2.0 feed: every post with its title, summary, date and tags. Prerendered: it reads nothing at request time. */
export function GET() {
  const base = siteUrl();
  const items = POSTS.map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}${href.post(p.slug)}</link>
      <guid isPermaLink="true">${base}${href.post(p.slug)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${esc(p.summary)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(AUTHOR.name)}</title>
    <link>${base}${href.home}</link>
    <description>${esc(AUTHOR.tagline)}</description>
    <language>en-gb</language>
    <managingEditor>${AUTHOR.email} (${esc(AUTHOR.name)})</managingEditor>
    <lastBuildDate>${rfc822(POSTS[0].date)}</lastBuildDate>
    <atom:link href="${base}${href.feed}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
