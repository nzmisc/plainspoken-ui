import type { ReactNode } from "react";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { cn } from "@/lib/utils";

// The pieces a post is written with, inside <Prose>: headings that link to themselves, code blocks
// with a label and a copy button, figures, and footnotes. All render on the server.

export interface BlogHeadingProps {
  /** The fragment it can be linked to: /posts/x#the-setup */
  id: string;
  /** Default 2 */
  level?: 2 | 3 | 4;
  /** The heading's text (plain text, so the link's name can say it) */
  children: string;
}

/**
 * A section heading with a "#" link to itself, which shows on hover or keyboard focus (always on
 * touch screens), so readers can copy a link to the section. The link's accessible name says which
 * section it points at.
 */
export function BlogHeading({ id, level = 2, children }: BlogHeadingProps) {
  const H = `h${level}` as const;
  return (
    <H id={id} className="group/heading scroll-mt-4">
      {children}
      <a
        href={`#${id}`}
        aria-label={`Link to the section “${children}”`}
        className={cn(
          "ml-[0.35em] font-normal text-muted-foreground! no-underline! opacity-0 group-hover/heading:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        )}
      >
        #
      </a>
    </H>
  );
}

export interface BlogCodeProps {
  /** The source, for the copy button (and shown as it is when there is no `html`) */
  code: string;
  /** The language, shown in the label when there is no title */
  lang?: string;
  /** A file name or a few words: "drain.sh", "on the old primary" */
  title?: string;
  /**
   * The code already highlighted as HTML (from shiki, highlight.js, Prism), rendered in place of
   * the plain text. Highlight on the server so no highlighter ships to the browser.
   */
  html?: string;
  className?: string;
}

/**
 * A code block for a post: a label bar (file name or language) with a copy button, over the code,
 * which scrolls sideways instead of wrapping and can be scrolled with the keyboard. Takes plain
 * code, or code a server-side highlighter has turned into HTML.
 */
export function BlogCode({ code, lang, title, html, className }: BlogCodeProps) {
  const label = title ?? lang;
  return (
    <div
      data-slot="blog-code"
      className={cn(
        "mb-[0.75em] border border-border bg-muted/40 last:mb-0",
        "[&_pre]:m-0! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:px-[0.75em]! [&_pre]:py-[0.6em]!",
        className,
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-2 border-b border-border bg-muted pr-0.5 pl-2 font-sans">
        <span className="truncate font-mono text-[12px] text-muted-foreground">{label}</span>
        <CopyButton text={code} name={label ? `${label} code` : "code"} />
      </div>
      {html != null ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

export interface BlogFigureProps {
  /** The picture: an <img>, an inline SVG chart, a table drawn from components */
  children: ReactNode;
  /** What it shows, under it. Write it so it makes sense on its own. */
  caption: ReactNode;
  className?: string;
}

/** A figure with a caption, framed in a thin border so a chart or diagram reads as one thing. */
export function BlogFigure({ children, caption, className }: BlogFigureProps) {
  return (
    <figure data-slot="blog-figure" className={cn("border border-border bg-background p-3", className)}>
      <div className="overflow-x-auto">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** A footnote mark in the text: a superscript number linking to the note, which links back. */
export function BlogFootnoteRef({ n }: { n: number }) {
  return (
    <sup>
      <a href={`#fn-${n}`} id={`fnref-${n}`} data-footnote-ref aria-describedby="footnote-label" className="scroll-mt-4">
        {n}
      </a>
    </sup>
  );
}

/**
 * The notes at the end of a post, numbered in order, each with a ↩ link back to its mark. The
 * markup is what remark-gfm writes (section[data-footnotes]), so Prose styles it like Markdown's.
 */
export function BlogFootnotes({ notes }: { notes: ReactNode[] }) {
  return (
    <section data-footnotes className="footnotes">
      <h2 id="footnote-label" className="sr-only">
        Footnotes
      </h2>
      <ol>
        {notes.map((note, i) => (
          <li key={i} id={`fn-${i + 1}`} className="scroll-mt-4">
            <p>
              {note}{" "}
              <a href={`#fnref-${i + 1}`} data-footnote-backref aria-label={`Back to reference ${i + 1}`}>
                ↩&#xFE0E;
              </a>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
