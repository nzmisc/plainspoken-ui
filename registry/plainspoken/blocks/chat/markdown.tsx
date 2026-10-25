"use client";

import { Fragment, createElement, useEffect, useMemo, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { Streamdown, useIsCodeFenceIncomplete, type CodeHighlighterPlugin, type Components, type ExtraProps, type HighlightToken, type PluginConfig } from "streamdown";
import { code as shikiPlugin } from "@streamdown/code";
import { createMathPlugin } from "@streamdown/math";
import "katex/dist/katex.min.css";
import { prepareMath } from "@/registry/plainspoken/blocks/chat/math";
import { ChatMermaid } from "@/registry/plainspoken/blocks/chat/mermaid";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { TextLink } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

// Streamdown parses Markdown as it streams in (closing a half-written table or code fence so it
// draws), and renders each element through a component map. Every element it styles itself is
// replaced here by a plain one, so none of its own Tailwind classes are used: Prose sets the type,
// and tables, links and code blocks are the library's components. Nothing needs an @source line.
// Math goes through its KaTeX plugin, after prepareMath has put every formula in $$…$$.

type Props<K extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[K] & ExtraProps;

/** Code text arrives as a string, or (with some plugins) as an array of strings */
const plainText = (children: ReactNode): string => (Array.isArray(children) ? children.map(plainText).join("") : typeof children === "string" ? children : "");

type Highlighted = { code: string; lines: HighlightToken[][] };

// Typed as Streamdown sees it: any language name, checked with supportsLanguage
const highlighter: CodeHighlighterPlugin = shikiPlugin;

/**
 * Tokens from Streamdown's Shiki plugin, which caches finished blocks and, while a block streams,
 * only tokenises the lines that changed. Each token carries a light and a dark colour.
 */
function useHighlight(code: string, language: string, streaming: boolean): Highlighted | null {
  const [result, setResult] = useState<Highlighted | null>(null);
  useEffect(() => {
    if (!language || !highlighter.supportsLanguage(language)) return;
    let live = true;
    const apply = (r: { tokens: HighlightToken[][] }) => {
      if (live) setResult({ code, lines: r.tokens });
    };
    const ready = highlighter.highlight({ code, language, themes: highlighter.getThemes(), isIncomplete: streaming }, apply);
    if (ready) void Promise.resolve(ready).then(apply);
    return () => {
      live = false;
    };
  }, [code, language, streaming]);
  return result;
}

const tokenStyle = (t: HighlightToken) =>
  ({
    "--hl": t.htmlStyle?.color ?? t.color,
    "--hl-dark": t.htmlStyle?.["--shiki-dark"] ?? t.htmlStyle?.color ?? t.color,
    fontStyle: t.htmlStyle?.["font-style"],
    fontWeight: t.htmlStyle?.["font-weight"],
  }) as CSSProperties;

export interface ChatCodeBlockProps {
  code: string;
  /** From the fence (```ts): shown in the label bar and used for highlighting */
  language?: string;
  /** Still being written: highlighting follows along without caching */
  streaming?: boolean;
  className?: string;
}

/**
 * A code block in an answer, the same as a blog post's: a label bar with the language and a copy
 * button, over the code, which scrolls sideways instead of wrapping and can be scrolled with the
 * keyboard. Highlighted in the browser with Shiki (GitHub's light and dark colours, by the theme).
 * While highlighting catches up, the newest lines show as plain text.
 */
export function ChatCodeBlock({ code, language = "", streaming = false, className }: ChatCodeBlockProps) {
  const lang = language.toLowerCase();
  const hl = useHighlight(code, lang, streaming);
  const lines = hl && code.startsWith(hl.code) ? hl.lines : null;
  const rest = lines ? code.slice(hl!.code.length) : code;
  const label = lang || "text";
  return (
    <div
      data-slot="chat-code-block"
      className={cn(
        "mb-[0.75em] border border-border bg-muted/40 last:mb-0",
        "[&_pre]:m-0! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:px-[0.75em]! [&_pre]:py-[0.6em]!",
        className,
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-2 border-b border-border bg-muted pr-0.5 pl-2 font-sans">
        <span className="truncate font-mono text-[12px] text-muted-foreground">{label}</span>
        <CopyButton text={code} name={`${label} code`} />
      </div>
      <pre tabIndex={0} className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <code>
          {lines?.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && "\n"}
              {line.map((t, j) => (
                <span key={j} style={tokenStyle(t)} className="text-(--hl) dark:text-(--hl-dark)">
                  {t.content}
                </span>
              ))}
            </Fragment>
          ))}
          {rest}
        </code>
      </pre>
    </div>
  );
}

/** A fenced code block (Streamdown marks those with data-block; inline code goes to inlineCode), or a Mermaid diagram */
function BlockCode({ className, children }: Props<"code">) {
  const streaming = useIsCodeFenceIncomplete();
  const language = /language-([^\s]+)/.exec(className ?? "")?.[1] ?? "";
  const code = plainText(children).replace(/\n+$/, "");
  // A diagram is drawn once its fence has closed; until then it is code like any other
  if (language === "mermaid" && !streaming) return <ChatMermaid code={code} />;
  return <ChatCodeBlock code={code} language={language} streaming={streaming} />;
}

/** The props without what isn't for the DOM: the hast node Streamdown passes along, and any `drop` keys */
function own<T extends ExtraProps, D extends keyof T = never>(props: T, ...drop: D[]): Omit<T, "node" | D> {
  const rest = { ...props } as Record<PropertyKey, unknown>;
  for (const k of ["node", ...drop]) delete rest[k];
  return rest as Omit<T, "node" | D>;
}

/** Links open in a new tab and say so; a link still being written is only underlined text. */
function Link(props: Props<"a">) {
  const { href, children } = props;
  if (!href || href.startsWith("streamdown:")) return <span className="text-link underline underline-offset-2">{children}</span>;
  // In-page (footnotes) and mail links stay as they are
  if (!/^https?:/i.test(href)) return <a {...own(props)} />;
  return (
    <TextLink href={href} external>
      {children}
    </TextLink>
  );
}

function Img(props: Props<"img">) {
  // A picture whose address is still arriving
  if (typeof props.src !== "string" || props.src.startsWith("streamdown:")) return null;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt comes from the Markdown
  return <img loading="lazy" {...own(props)} />;
}

/** A right-aligned column (`---:`) holds numbers: TableCell's numeric style */
function Td(props: Props<"td">) {
  const right = props.style?.textAlign === "right";
  return <TableCell numeric={right} {...(right ? own(props, "style") : own(props))} />;
}

/** A header cell stays left-aligned over any column, so the alignment from the Markdown goes */
function Th(props: Props<"th">) {
  return <TableHead {...own(props, "style")} />;
}

/** Render the element as it is, for Prose to style */
function plain<K extends keyof JSX.IntrinsicElements>(tag: K) {
  function Plain(props: Props<K>) {
    return createElement(tag, own(props));
  }
  Plain.displayName = `Plain(${tag})`;
  return Plain;
}

/** Every element Streamdown draws with classes of its own, replaced */
const COMPONENTS: Components = {
  p: plain("p"),
  strong: plain("strong"),
  h1: plain("h1"),
  h2: plain("h2"),
  h3: plain("h3"),
  h4: plain("h4"),
  h5: plain("h5"),
  h6: plain("h6"),
  ul: plain("ul"),
  ol: plain("ol"),
  li: plain("li"),
  hr: plain("hr"),
  blockquote: plain("blockquote"),
  sup: plain("sup"),
  sub: plain("sub"),
  a: Link,
  img: Img,
  code: BlockCode,
  inlineCode: plain("code"),
  // `rules` is an old HTML attribute that Markdown never sets, and a prop of Table's
  table: (props: Props<"table">) => <Table {...own(props, "rules")} />,
  thead: (props: Props<"thead">) => <TableHeader {...own(props)} />,
  tbody: (props: Props<"tbody">) => <TableBody {...own(props)} />,
  tr: (props: Props<"tr">) => <TableRow {...own(props)} />,
  th: Th,
  td: Td,
};

// Streamdown's root keeps its own "space-y-4 [&>*:first-child]:mt-0 …"; tailwind-merge drops the
// spacing for this, and Prose spaces the blocks.
const ROOT = "space-y-0 whitespace-normal [&>:first-child]:mt-0 [&>:last-child]:mb-0";

// Single-dollar math stays off: prepareMath decides which $…$ are formulas. A formula KaTeX can't
// read shows as its source, in the muted colour, rather than as a red error.
const PLUGINS: PluginConfig = { math: createMathPlugin({ singleDollarTextMath: false, errorColor: "var(--muted-foreground)" }) };
// remend would close a half-written $$ so KaTeX draws it; prepareMath shows it as text instead
const REMEND = { katex: false, inlineKatex: false };

const MATH = cn(
  // KaTeX's 1.21em is matched to serif text; next to Geist this is closer
  "[&_.katex]:text-[1.1em]",
  // Fraction bars and root signs in the text colour, not the border colour every element gets
  "[&_.katex_*]:border-current",
  // A wide formula scrolls sideways on its own, centred while it fits
  "[&_.katex-display]:my-[0.75em] [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-[0.2em]",
);

export interface ChatMarkdownProps {
  /** The Markdown, whole or as far as it has arrived */
  children: string;
  /** Still arriving: unfinished Markdown (an open fence, half a table, `**bold`) is closed for drawing */
  streaming?: boolean;
  /** base 14px (default), or sm 13px for reasoning and notes */
  size?: "sm" | "base";
  className?: string;
}

/**
 * Markdown from a model, drawn as it streams in: headings, lists and task lists, tables (the
 * library's, numbers right-aligned), highlighted code with a copy button, quotes, footnotes,
 * math (KaTeX; $…$, $$…$$, \(…\) and \[…\], while "$5 and $10" stays text), and links that open
 * in a new tab. Built on Streamdown, restyled entirely through its component map,
 * so it looks like the rest of the library: Prose for the type, no rounded corners or shadows.
 * Raw HTML in the Markdown is sanitised; links and pictures are only drawn once their address has
 * fully arrived.
 */
export function ChatMarkdown({ children, streaming = false, size = "base", className }: ChatMarkdownProps) {
  const markdown = useMemo(() => prepareMath(children, streaming), [children, streaming]);
  return (
    <Prose data-slot="chat-markdown" size={size} measure={false} className={cn(MATH, className)}>
      <Streamdown
        components={COMPONENTS}
        plugins={PLUGINS}
        remend={REMEND}
        isAnimating={streaming}
        parseIncompleteMarkdown={streaming}
        controls={false}
        className={ROOT}
      >
        {markdown}
      </Streamdown>
    </Prose>
  );
}
