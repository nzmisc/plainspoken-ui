"use client";

import { Fragment, createContext, createElement, useContext, useId, useMemo, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { Streamdown, tableDataToCSV, tableDataToMarkdown, tableDataToTSV, useIsCodeFenceIncomplete, type Components, type ExtraProps, type PluginConfig, type TableData } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import "katex/dist/katex.min.css";
import { Download } from "@/registry/plainspoken/lib/icons";
import { downloadText } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatBlockBar, ChatFullView } from "@/registry/plainspoken/blocks/chat/block-bar";
import { useHighlight, type CodeToken } from "@/registry/plainspoken/blocks/chat/highlight";
import { prepareMath } from "@/registry/plainspoken/blocks/chat/math";
import { ChatMermaid } from "@/registry/plainspoken/blocks/chat/mermaid";
import { Button } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { TextLink } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

// Streamdown parses Markdown as it streams in (closing a half-written table or code fence so it
// draws), and renders each element through a component map. Every element it styles itself is
// replaced here by a plain one, so none of its own Tailwind classes are used: Prose sets the type,
// and tables, links and code blocks are the library's components. Nothing needs an @source line.
// Math goes through its KaTeX plugin, after prepareMath has put every formula in $$…$$. Code is
// highlighted by one shared Shiki highlighter (highlight.ts) rather than the code plugin's.

type Props<K extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[K] & ExtraProps;
type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };

/** Code text arrives as a string, or (with some plugins) as an array of strings */
const plainText = (children: ReactNode): string => (Array.isArray(children) ? children.map(plainText).join("") : typeof children === "string" ? children : "");

/** The text of a hast node, as a table cell's value */
const hastText = (n: HastNode | undefined): string => (!n ? "" : n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(hastText).join(""));

const tokenStyle = (t: CodeToken) => ({ "--hl": t.light, "--hl-dark": t.dark, fontStyle: t.italic ? "italic" : undefined, fontWeight: t.bold ? "bold" : undefined }) as CSSProperties;

/** The file extension for a code block's download */
const EXT: Record<string, string> = { javascript: "js", typescript: "ts", python: "py", bash: "sh", shell: "sh", rust: "rs", ruby: "rb", markdown: "md", yaml: "yml", text: "txt" };
const extFor = (lang: string) => EXT[lang] ?? (/^[a-z0-9]{1,6}$/.test(lang) ? lang : "txt");

/** Highlighted lines, then whatever hasn't been highlighted yet as plain text */
function CodeLines({ code, language, streaming }: { code: string; language: string; streaming: boolean }) {
  const hl = useHighlight(code, language, streaming);
  const rest = hl ? code.slice(hl.code.length) : code;
  return (
    <code>
      {hl?.lines.map((line, i) => (
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
  );
}

export interface ChatCodeBlockProps {
  code: string;
  /** From the fence (```ts): shown in the label bar and used for highlighting */
  language?: string;
  /** Still being written: highlighting follows along a line behind */
  streaming?: boolean;
  /** Leave off the label bar and the border: for code shown inside something with its own (a document panel) */
  bare?: boolean;
  /** Offer Full screen in the bar (default on) */
  fullscreen?: boolean;
  className?: string;
}

/**
 * A code block in an answer, the same as a blog post's: a label bar with the language, Copy and
 * Full screen, over the code, which scrolls sideways instead of wrapping and can be scrolled with
 * the keyboard. Highlighted in the browser with Shiki (GitHub's light and dark colours, by the
 * theme); while it streams, the line being written shows plain until it is finished. Full screen
 * opens it in a dialog with Copy and Download.
 */
export function ChatCodeBlock({ code, language = "", streaming = false, bare = false, fullscreen = true, className }: ChatCodeBlockProps) {
  const [full, setFull] = useState(false);
  const lang = language.toLowerCase();
  const label = lang || "text";
  const pre = (big: boolean) => (
    <pre
      tabIndex={0}
      className={cn("focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring", big && "min-h-full text-[14px]")}
    >
      <CodeLines code={code} language={lang} streaming={streaming} />
    </pre>
  );
  return (
    <div
      data-slot="chat-code-block"
      className={cn(
        !bare && "mb-[0.75em] border border-border bg-muted/40 last:mb-0",
        "[&_pre]:m-0! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:px-[0.75em]! [&_pre]:py-[0.6em]!",
        className,
      )}
    >
      {!bare && (
        <ChatBlockBar label={label} onFullscreen={fullscreen && !streaming ? () => setFull(true) : undefined}>
          <CopyButton text={code} name={`${label} code`} />
        </ChatBlockBar>
      )}
      {pre(false)}
      {fullscreen && (
        <ChatFullView
          open={full}
          onClose={() => setFull(false)}
          title={`Code, ${label}`}
          bodyClassName="bg-muted/40 p-0 font-mono [&_pre]:m-0 [&_pre]:px-4 [&_pre]:py-3"
          actions={
            <>
              <CopyButton text={code} label="Copy" size="sm" variant="default" />
              <Button icon={Download} onClick={() => downloadText(code, `snippet.${extFor(lang)}`)}>
                Download
              </Button>
            </>
          }
        >
          {pre(true)}
        </ChatFullView>
      )}
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

/** A table's header and rows as text, from its hast node */
function tableData(node: HastNode | undefined): TableData {
  const rows: string[][] = [];
  let headers: string[] = [];
  const walk = (n: HastNode, inHead: boolean) => {
    for (const c of n.children ?? []) {
      if (c.tagName === "thead") walk(c, true);
      else if (c.tagName === "tbody") walk(c, false);
      else if (c.tagName === "tr") {
        const cells = (c.children ?? []).filter((x) => x.tagName === "td" || x.tagName === "th").map((x) => hastText(x).trim());
        if (inHead) headers = cells;
        else rows.push(cells);
      }
    }
  };
  if (node) walk(node, false);
  return { headers, rows };
}

/**
 * A table in an answer: the library's Table under a bar that says how many rows it has, with
 * Copy (as tab-separated text, which pastes into a spreadsheet as cells) and Full screen, where
 * it can be copied as Markdown and downloaded as CSV or Markdown.
 */
function TableBlock(props: Props<"table">) {
  const [full, setFull] = useState(false);
  const streaming = useContext(Streaming);
  const data = useMemo(() => tableData(props.node as HastNode | undefined), [props.node]);
  // `rules` is an old HTML attribute that Markdown never sets, and a prop of Table's
  const table = (frameless: boolean) => <Table frameless={frameless} {...own(props, "rules")} />;
  const rows = `${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"}`;
  return (
    <div data-slot="chat-table" className="mb-[0.75em] w-max max-w-full border border-border last:mb-0 [&_table]:mb-0!">
      <ChatBlockBar label="table" detail={rows} onFullscreen={streaming ? undefined : () => setFull(true)}>
        {!streaming && <CopyButton text={tableDataToTSV(data)} name="table" />}
      </ChatBlockBar>
      {table(true)}
      <ChatFullView
        open={full}
        onClose={() => setFull(false)}
        title={`Table, ${rows}`}
        bodyClassName="[&_table]:w-full"
        actions={
          <>
            <CopyButton text={tableDataToTSV(data)} label="Copy" size="sm" variant="default" />
            <CopyButton text={tableDataToMarkdown(data)} label="Copy as Markdown" size="sm" variant="default" />
            <Button icon={Download} onClick={() => downloadText(tableDataToCSV(data), "table.csv", "text/csv")}>
              CSV
            </Button>
            <Button icon={Download} onClick={() => downloadText(tableDataToMarkdown(data), "table.md", "text/markdown")}>
              Markdown
            </Button>
          </>
        }
      >
        <div className="text-[14px]">{table(false)}</div>
      </ChatFullView>
    </div>
  );
}

/** Render the element as it is, for Prose to style */
function plain<K extends keyof JSX.IntrinsicElements>(tag: K) {
  function Plain(props: Props<K>) {
    return createElement(tag, own(props));
  }
  Plain.displayName = `Plain(${tag})`;
  return Plain;
}

/**
 * Footnotes' ids, made unique per answer: remark gives every answer the same "footnote-label"
 * heading and fn-1 notes, so two answers with footnotes on one page would share ids.
 */
const IdPrefix = createContext("");
/** Whether the answer is still arriving: a table's buttons wait for it to finish */
const Streaming = createContext(false);

const fix = (prefix: string, v: unknown) => (v === "footnote-label" ? `${prefix}footnote-label` : v);

function H2(props: Props<"h2">) {
  const prefix = useContext(IdPrefix);
  return <h2 {...own(props)} id={fix(prefix, props.id) as string | undefined} />;
}

function Section(props: Props<"section">) {
  const prefix = useContext(IdPrefix);
  return <section {...own(props)} aria-labelledby={fix(prefix, props["aria-labelledby"]) as string | undefined} />;
}

/** Every element Streamdown draws with classes of its own, replaced */
const COMPONENTS: Components = {
  p: plain("p"),
  strong: plain("strong"),
  h1: plain("h1"),
  h2: H2,
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
  section: Section,
  a: Link,
  img: Img,
  code: BlockCode,
  inlineCode: plain("code"),
  table: TableBlock,
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
 * library's, numbers right-aligned, with Copy and Full screen), highlighted code with Copy and
 * Full screen, quotes, footnotes, math (KaTeX; $…$, $$…$$, \(…\) and \[…\], while "$5 and $10"
 * stays text), Mermaid diagrams, and links that open in a new tab. Built on Streamdown, restyled
 * entirely through its component map, so it looks like the rest of the library: Prose for the
 * type, no rounded corners or shadows. Raw HTML in the Markdown is sanitised; links and pictures
 * are only drawn once their address has fully arrived. Footnote ids are unique to each answer.
 */
export function ChatMarkdown({ children, streaming = false, size = "base", className }: ChatMarkdownProps) {
  const markdown = useMemo(() => prepareMath(children, streaming), [children, streaming]);
  const prefix = `${useId().replace(/[^a-zA-Z0-9]/g, "")}-`;
  const remarkRehype = useMemo(() => ({ clobberPrefix: prefix }), [prefix]);
  return (
    <IdPrefix value={prefix}>
      <Streaming value={streaming}>
        <Prose data-slot="chat-markdown" size={size} measure={false} className={cn(MATH, className)}>
          <Streamdown
            components={COMPONENTS}
            plugins={PLUGINS}
            remend={REMEND}
            remarkRehypeOptions={remarkRehype}
            isAnimating={streaming}
            parseIncompleteMarkdown={streaming}
            controls={false}
            className={ROOT}
          >
            {markdown}
          </Streamdown>
        </Prose>
      </Streaming>
    </IdPrefix>
  );
}
