import { Fragment, type ReactNode } from "react";
import { BlogFootnotes, BlogHeading } from "@/registry/plainspoken/blocks/blog/article-parts";
import { BlogToc } from "@/registry/plainspoken/blocks/blog/toc";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { cn } from "@/lib/utils";

export interface BlogArticleSection {
  /** The heading's id, for links and the table of contents */
  id: string;
  title: string;
  /** 3 for a subsection. Default 2. */
  level?: 2 | 3;
  body: ReactNode;
}

export interface BlogArticleProps {
  /** BlogPostHeader, or your own <header> with the page's h1 */
  header: ReactNode;
  /** The text before the first heading */
  children?: ReactNode;
  /** The rest of the post, one entry per heading. Each heading gets an id and a link to itself. */
  sections?: BlogArticleSection[];
  /** Footnote texts, in order; mark them in the text with BlogFootnoteRef */
  footnotes?: ReactNode[];
  /** Under the text: reply link, previous and next posts (BlogPostFooter) */
  footer?: ReactNode;
  /** Show a table of contents. Default: when there are three sections or more. */
  toc?: boolean;
  /** Reading size of the text. Default lg (17px). */
  size?: "base" | "lg";
  className?: string;
}

/**
 * A whole blog post in one <article>: the header, the text set in Prose at a reading size, the
 * footnotes, and a footer. With enough sections it adds a table of contents: a sticky side column
 * that follows your reading on wide screens, a closed "On this page" box above the text on narrow
 * ones. Write the body in plain elements (p, ul, blockquote, table) and the BlogCode, BlogFigure
 * and BlogFootnoteRef pieces.
 */
export function BlogArticle({ header, children, sections = [], footnotes, footer, toc, size = "lg", className }: BlogArticleProps) {
  const items = sections.map(({ id, title, level }) => ({ id, title, level }));
  const showToc = toc ?? sections.length >= 3;
  return (
    <article data-slot="blog-article" className={cn("flex flex-col gap-6", className)}>
      {header}
      <div className={cn("grid gap-x-12 gap-y-6", showToc && "lg:grid-cols-[minmax(0,1fr)_13rem]")}>
        <div className="flex min-w-0 flex-col gap-8">
          {showToc && <BlogToc items={items} variant="collapsible" className="lg:hidden" />}
          <Prose size={size}>
            {children}
            {sections.map((s) => (
              <Fragment key={s.id}>
                <BlogHeading id={s.id} level={s.level}>
                  {s.title}
                </BlogHeading>
                {s.body}
              </Fragment>
            ))}
            {footnotes && footnotes.length > 0 && <BlogFootnotes notes={footnotes} />}
          </Prose>
          {footer}
        </div>
        {showToc && (
          <div className="hidden lg:block">
            <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto pb-4">
              <BlogToc items={items} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
