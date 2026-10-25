import { BlogCode, BlogFigure, BlogHeading } from "@/registry/plainspoken/blocks/blog/article-parts";
import { Prose } from "@/registry/plainspoken/ui/prose";

/** The pieces on their own, inside Prose: a heading with a link to itself, a code block with a copy button, and a figure. */
export default function BlogArticleParts() {
  return (
    <Prose>
      <BlogHeading id="parts-the-gate">The gate</BlogHeading>
      <BlogCode lang="sql" code={"SELECT pg_last_wal_replay_lsn() >= '3F/9A0021C8'::pg_lsn AS caught_up;"} />
      <BlogFigure caption="Requests per second over a day, drawn as an inline SVG in the theme's colours.">
        <svg viewBox="0 0 300 60" className="h-auto w-full max-w-md" role="img" aria-label="A gentle rise in the morning and a fall at night">
          <polyline points="0,50 40,48 80,30 120,20 160,18 200,22 240,35 300,50" fill="none" stroke="var(--color-chart-1)" strokeWidth="2" />
        </svg>
      </BlogFigure>
    </Prose>
  );
}
