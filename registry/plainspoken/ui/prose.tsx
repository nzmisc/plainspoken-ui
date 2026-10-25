import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Typography for long text, as descendant classes on one wrapper, so it styles markup it didn't
 * write (a Markdown renderer's output, an HTML string) and installs as this one file. Tailwind's
 * preflight strips every browser default; these put back the ones a document needs (bullets,
 * heading sizes, space between blocks) in the plain-HTML style of the rest of the library.
 * Everything is in em, so the size option scales it all. :where() keeps the broad rules weak, so
 * the specific ones (and your own classes) win without !important.
 */
const PROSE = [
  "min-w-0 break-words",
  // Blocks: space after each, none before the first or after the last
  "[&_:where(p,ul,ol,dl,blockquote,pre,table,details,figure,hr,.markdown-alert)]:mb-[0.75em]",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",

  // Headings step down in size; h1 and h2 get a rule under them; h6 is muted
  "[&_:where(h1,h2,h3,h4,h5,h6)]:mt-[1.4em] [&_:where(h1,h2,h3,h4,h5,h6)]:mb-[0.5em] [&_:where(h1,h2,h3,h4,h5,h6)]:leading-tight [&_:where(h1,h2,h3,h4,h5,h6)]:font-bold",
  "[&_h1]:border-b [&_h1]:border-border [&_h1]:pb-[0.15em] [&_h1]:text-[1.6em]",
  "[&_h2]:border-b [&_h2]:border-border [&_h2]:pb-[0.15em] [&_h2]:text-[1.3em]",
  "[&_h3]:text-[1.15em] [&_h4]:text-[1em] [&_h5]:text-[0.92em] [&_h6]:text-[0.92em] [&_h6]:text-muted-foreground",

  // Lists, with the marker changing at each level as browsers do
  "[&_ul]:list-disc [&_ul]:pl-[1.6em] [&_ol]:list-decimal [&_ol]:pl-[1.9em]",
  "[&_ul_ul]:list-[circle] [&_ul_ul_ul]:list-[square] [&_ol_ol]:list-[lower-alpha] [&_ol_ol_ol]:list-[lower-roman]",
  "[&_li+li]:mt-[0.25em] [&_li>:where(ul,ol)]:mt-[0.25em] [&_li>:where(ul,ol)]:mb-0 [&_li>p]:mb-[0.4em] [&_::marker]:text-muted-foreground",
  // GFM task lists: a task's checkbox takes the place of its bullet, in the list's own indent, so
  // plain items in the same list keep their bullets and every item's text lines up
  "[&_li.task-list-item]:list-none",
  "[&_.task-list-item_input]:-ml-[1.3em] [&_.task-list-item_input]:mr-[0.35em] [&_.task-list-item_input]:align-[-0.1em] [&_.task-list-item_input]:accent-primary",

  // Inline: real links, code, keys, marks
  "[&_a]:text-link [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:decoration-2 [&_a:visited]:text-link-visited",
  "[&_:where(code,kbd,samp)]:font-mono [&_:where(code,kbd,samp)]:text-[0.875em]",
  "[&_:not(pre)>code]:border [&_:not(pre)>code]:border-border/60 [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-[0.25em]",
  "[&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-[0.3em] [&_kbd]:whitespace-nowrap",
  "[&_mark]:bg-warning/25 [&_mark]:text-inherit",
  "[&_abbr[title]]:cursor-help [&_abbr[title]]:underline [&_abbr[title]]:decoration-dotted",
  "[&_del]:text-muted-foreground",

  // Code blocks scroll sideways rather than wrap. A data-lang (or data-language) attribute shows
  // as a small label; Prose adds it to HTML strings from class="language-xyz" itself.
  "[&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:px-[0.6em] [&_pre]:py-[0.45em] [&_pre]:leading-[1.45]",
  "[&_pre_code]:whitespace-pre",
  "[&_pre[data-lang]]:before:content-[attr(data-lang)] [&_pre[data-language]]:before:content-[attr(data-language)]",
  "[&_pre:where([data-lang],[data-language])]:before:sticky [&_pre:where([data-lang],[data-language])]:before:left-0 [&_pre:where([data-lang],[data-language])]:before:-mx-[0.6em] [&_pre:where([data-lang],[data-language])]:before:-mt-[0.45em] [&_pre:where([data-lang],[data-language])]:before:mb-[0.45em] [&_pre:where([data-lang],[data-language])]:before:block [&_pre:where([data-lang],[data-language])]:before:border-b [&_pre:where([data-lang],[data-language])]:before:border-border/60 [&_pre:where([data-lang],[data-language])]:before:px-[0.6em] [&_pre:where([data-lang],[data-language])]:before:font-sans [&_pre:where([data-lang],[data-language])]:before:text-[12px] [&_pre:where([data-lang],[data-language])]:before:text-muted-foreground",

  // Blockquotes, nested ones too
  "[&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-[0.9em] [&_blockquote]:text-muted-foreground [&_blockquote_blockquote]:mt-[0.5em]",

  // Tables: bordered cells, scrolling sideways on their own when too wide. Headers stay
  // left-aligned even where a renderer aligned the column (markdown-it writes inline styles,
  // hence the one !important); numbers in cells line up.
  "[&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:border-collapse [&_table]:overflow-x-auto",
  "[&_:where(th,td)]:border [&_:where(th,td)]:border-border [&_:where(th,td)]:px-[0.5em] [&_:where(th,td)]:py-[0.15em] [&_:where(th,td)]:align-top",
  "[&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left! [&_td]:tabular-nums [&_td[align=right]]:text-right [&_td[align=center]]:text-center",
  "data-[table-cells=nowrap]:[&_:where(th,td)]:whitespace-nowrap",

  "[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",

  // Images keep their size up to the column's width
  "[&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full [&_img]:align-middle",
  "[&_figcaption]:mt-[0.25em] [&_figcaption]:text-[0.85em] [&_figcaption]:text-muted-foreground",

  // Definition lists
  "[&_dt]:font-semibold [&_dd]:pl-[1.6em] [&_dd+dt]:mt-[0.4em]",

  // <details>
  "[&_details]:border [&_details]:border-border [&_details]:px-[0.5em] [&_details[open]]:pb-[0.35em]",
  "[&_summary]:cursor-pointer [&_summary]:py-[0.2em] [&_summary]:font-semibold",
  "[&_details[open]>summary]:mb-[0.35em] [&_details[open]>summary]:border-b [&_details[open]>summary]:border-border/60",

  // Footnotes (remark's section[data-footnotes], markdown-it-footnote's .footnotes)
  "[&_:where(section[data-footnotes],.footnotes)]:mt-[1.5em] [&_:where(section[data-footnotes],.footnotes)]:border-t [&_:where(section[data-footnotes],.footnotes)]:border-border [&_:where(section[data-footnotes],.footnotes)]:pt-[0.4em] [&_:where(section[data-footnotes],.footnotes)]:text-[0.85em] [&_:where(section[data-footnotes],.footnotes)]:text-muted-foreground",
  "[&_.footnotes-sep]:hidden [&_.sr-only]:sr-only",
  "[&_:where([data-footnote-ref],.footnote-ref_a)]:before:content-['['] [&_:where([data-footnote-ref],.footnote-ref_a)]:after:content-[']']",

  // GitHub alerts: > [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
  "[&_.markdown-alert]:border-l-[3px] [&_.markdown-alert]:border-primary [&_.markdown-alert]:pl-[0.9em]",
  "[&_.markdown-alert-title]:mb-[0.2em] [&_.markdown-alert-title]:font-semibold [&_.markdown-alert-title_svg]:mr-[0.3em] [&_.markdown-alert-title_svg]:inline [&_.markdown-alert-title_svg]:fill-current",
  "[&_.markdown-alert-note_.markdown-alert-title]:text-primary",
  "[&_.markdown-alert.markdown-alert-tip]:border-success [&_.markdown-alert-tip_.markdown-alert-title]:text-success",
  "[&_.markdown-alert.markdown-alert-important]:border-link-visited [&_.markdown-alert-important_.markdown-alert-title]:text-link-visited",
  "[&_.markdown-alert.markdown-alert-warning]:border-warning [&_.markdown-alert-warning_.markdown-alert-title]:text-warning",
  "[&_.markdown-alert.markdown-alert-caution]:border-destructive [&_.markdown-alert-caution_.markdown-alert-title]:text-destructive",
].join(" ");

const SIZE = {
  sm: "text-[13px] leading-[1.5]",
  base: "text-[14px] leading-[1.55]",
  lg: "text-[17px] leading-[1.6]",
} as const;

/** class="language-ts" on a code block's <code> becomes data-lang="ts" on its <pre>, for the label */
function labelCodeBlocks(html: string): string {
  return html.replace(/<pre>(\s*<code[^>]*\bclass="[^"]*\blanguage-([\w+#.-]+))/g, '<pre data-lang="$2">$1');
}

export interface ProseProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> {
  /** Rendered Markdown as React elements (from react-markdown, MDX, or your own JSX)... */
  children?: ReactNode;
  /** ...or as an HTML string (from marked, markdown-it, remark-html). It must already be sanitized. */
  html?: string;
  /** sm 13px for notes in a panel; base 14px, the body size (default); lg 17px, for reading at length */
  size?: keyof typeof SIZE;
  /** Cap the line length for reading, at about 75 characters. On by default; false for full width. */
  measure?: boolean;
  /**
   * wrap (default, like GitHub): table cells wrap, and a table only scrolls once its words don't
   * fit. nowrap: every row stays on one line and wide tables scroll sideways; better for tables
   * of values (ports, paths, versions), worse for tables of sentences.
   */
  tableCells?: "wrap" | "nowrap";
  /** The element: article for a post, section for a part of a page. Default div. */
  as?: "div" | "article" | "section";
}

/**
 * Long text, styled: whatever CommonMark and GFM produce (headings, lists, task lists, tables,
 * code blocks, blockquotes, footnotes, GitHub alerts) and the HTML people put in Markdown (kbd,
 * details, sup and sub, dl, figure). It doesn't parse Markdown; pair it with any renderer, or
 * write the elements yourself. Three sizes, and a line length capped for reading. Renders on the
 * server; no script.
 */
export function Prose({ children, html, size = "base", measure = true, tableCells = "wrap", as: Tag = "div", className, ...rest }: ProseProps) {
  const cls = cn(PROSE, SIZE[size], measure && "max-w-[75ch]", className);
  return html != null ? (
    <Tag data-slot="prose" data-table-cells={tableCells} className={cls} dangerouslySetInnerHTML={{ __html: labelCodeBlocks(html) }} {...rest} />
  ) : (
    <Tag data-slot="prose" data-table-cells={tableCells} className={cls} {...rest}>
      {children}
    </Tag>
  );
}
