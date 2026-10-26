"use client";

import "katex/dist/katex.min.css";
import {
  isValidElement,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type DragEvent,
  type FocusEvent,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { ActiveNode } from "@milkdown/kit/plugin/block";
import type * as MilkdownLib from "@/registry/plainspoken/lib/milkdown";
import type { Align, BlockAt, BlockKind, Formats, LinkRange, MilkdownHost, MilkdownInstance, Slot, SlotStore, TurnInto } from "@/registry/plainspoken/lib/milkdown";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  CircleX,
  Code,
  CopyPlus,
  Ellipsis,
  ExternalLink,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Pencil,
  Pilcrow,
  Quote,
  Redo2,
  SeparatorHorizontal,
  Sigma,
  SquareCode,
  SquareSigma,
  Strikethrough,
  Table,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  Trash,
  Undo2,
  Unlink,
  type Glyph,
} from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Dialog, type CloseReason } from "@/registry/plainspoken/ui/dialog";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Field, useField, useFieldProps } from "@/registry/plainspoken/ui/field";
import { FileField } from "@/registry/plainspoken/ui/file-upload";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { Separator } from "@/registry/plainspoken/ui/separator";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";
import { cn } from "@/lib/utils";

/** write: formatted, as it will look. markdown: the source, in a monospace text box. preview: read only, rendered. */
export type EditorMode = "write" | "markdown" | "preview";

/**
 * Stores a picture and resolves with the URL to use for it; rejects (with an Error whose message
 * is shown) when it fails. Call onProgress with 0–1 as it goes, if you know; stop when the signal
 * aborts (the person pressed Cancel or deleted the picture).
 */
export type ImageUploadFunction = (file: File, options: { signal: AbortSignal; onProgress: (fraction: number) => void }) => Promise<string>;

/** What `editorRef` gives you, for pictures from your own media library or a button outside the editor */
export interface MilkdownEditorHandle {
  focus(): void;
  /** Uploads a picture (through onUploadImage) and puts it at the caret */
  insertImage(file: File, alt?: string): void;
  /** Puts a picture that is already online at the caret */
  insertImageUrl(url: string, alt?: string): void;
}

export interface MilkdownEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "children" | "placeholder"> {
  /** The text, as Markdown. Leave out (with defaultValue) to let the editor keep its own. */
  value?: string;
  defaultValue?: string;
  /** Called with the Markdown after every change */
  onChange?: (markdown: string) => void;
  mode?: EditorMode;
  defaultMode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  /** Shown while there is no text */
  placeholder?: string;
  disabled?: boolean;
  /** Can be read, switched between modes and copied, not changed */
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  /**
   * Height of the toolbar's controls, from the shared scale. Leave out to take the surrounding size
   * (md at the root). The text is 14px like Textarea's, 16px at lg.
   */
  size?: ControlSize;
  /**
   * Stores a picture and gives back its URL. Leave it out and pictures get object URLs (blob:),
   * which work only as long as the page is open.
   */
  onUploadImage?: ImageUploadFunction;
  /** Name for a hidden input holding the Markdown, for a plain form post */
  name?: string;
  editorRef?: Ref<MilkdownEditorHandle>;
  /** Classes for the scrolling text area: a min-h or max-h. Default min-h-40. */
  contentClassName?: string;
  /** Cap the line length at about 75 characters, centred: for a document editor that fills a page */
  measure?: boolean;
}

interface Upload {
  id: string;
  name: string;
  /** 0–1, or null when the upload function doesn't say */
  progress: number | null;
  /** The picture as a local object URL, shown until the upload is done */
  local: string;
  error?: string;
}

interface LinkDraft {
  href: string;
  text: string;
  /** The link being changed, when there is one already */
  range: LinkRange | null;
  /** Nothing selected: the link needs words of its own */
  askText: boolean;
  error?: string;
}

/** What the selection says about the popovers around the text */
interface Around {
  /** Words are selected: the bubble */
  range: boolean;
  /** The caret is in a link */
  link: LinkRange | null;
  /** A picture is selected, at this position */
  image: number | null;
  /** The selected picture's alt text, as it was when it was selected */
  imageAlt: string;
  /** The caret is in a table, which starts here */
  table: number | null;
  /** "/" typed at a line's start */
  slash: { from: number; to: number; query: string } | null;
  align: Align | null;
}

const NOTHING: Around = { range: false, link: null, image: null, imageAlt: "", table: null, slash: null, align: null };
const sameAround = (a: Around, b: Around) =>
  a.range === b.range &&
  a.image === b.image &&
  a.table === b.table &&
  a.align === b.align &&
  a.link?.from === b.link?.from &&
  a.link?.to === b.link?.to &&
  a.link?.href === b.link?.href &&
  a.slash?.from === b.slash?.from &&
  a.slash?.query === b.slash?.query;

const NO_FORMATS: Formats = { block: "p", bold: false, italic: false, strike: false, code: false, link: false, list: null, quote: false, table: false, image: false, undo: false, redo: false };
const sameFormats = (a: Formats, b: Formats) => (Object.keys(a) as (keyof Formats)[]).every((k) => a[k] === b[k]);

const MODES: { value: EditorMode; label: string }[] = [
  { value: "write", label: "Write" },
  { value: "markdown", label: "Markdown" },
  { value: "preview", label: "Preview" },
];
const MODE_SAID: Record<EditorMode, string> = { write: "Writing, with formatting", markdown: "Markdown source", preview: "Preview" };

const BLOCKS: { value: BlockKind; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "pre", label: "Code block" },
];

/** Code block languages offered in the picker; one from the Markdown that isn't here is added */
const LANGUAGES = ["bash", "css", "diff", "go", "html", "java", "javascript", "json", "jsx", "kotlin", "markdown", "python", "ruby", "rust", "sql", "swift", "toml", "tsx", "typescript", "yaml"];

const UPLOADING_PREFIX = "#uploading-";

const noSubscribe = () => () => {};
const useApple = () =>
  useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );

/** "Shift+X" → "⇧⌘X" on Apple devices, "Ctrl+Shift+X" elsewhere */
const keyLabel = (keys: string, apple: boolean) =>
  apple ? `${keys.includes("Alt+") ? "⌥" : ""}${keys.includes("Shift+") ? "⇧" : ""}⌘${keys.replace(/^(?:Shift\+|Alt\+)+/, "")}` : `Ctrl+${keys}`;
const ariaKeys = (keys: string, apple: boolean) => `${apple ? "Meta" : "Control"}+${keys}`;

let uploadCount = 0;
const uploadId = () => `${(++uploadCount).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** "harbour-at-dusk.jpg" → "harbour at dusk": a start on the alt text, to be put in words */
const altFromName = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim();

/** What people type for a link: "example.com" is a web address, "ana@example.com" an email address */
function normalizeHref(s: string): string {
  const t = s.trim();
  if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || /^[/#?.]/.test(t)) return t;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(t)) return `mailto:${t}`;
  if (/^(www\.)?[\w-]+(\.[\w-]+)+(:\d+)?([/?#]|$)/i.test(t)) return `https://${t}`;
  return t;
}

/** Only http(s), mailto, tel and relative addresses for links; pictures may also be blob: or data:image */
function safeHref(url: string, image = false): boolean {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim());
  if (!scheme) return true;
  const s = scheme[1].toLowerCase();
  return s === "http" || s === "https" || (!image && (s === "mailto" || s === "tel")) || (image && s === "blob");
}

const isImageFile = (f: File) => f.type.startsWith("image/");
const markdownUrl = (url: string) => (/[\s()<>]/.test(url) ? `<${url.replace(/>/g, "%3E")}>` : url);
const imageMarkdown = (alt: string, src: string) => `![${alt.replace(/([\\[\]])/g, "\\$1")}](${markdownUrl(src)})`;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/** Moves focus to the next (or previous) focusable thing on the page outside `from` */
function focusPast(from: HTMLElement, back: boolean) {
  const all = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !from.contains(el) && el.offsetParent !== null);
  const after = all.filter((el) => from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const before = all.filter((el) => from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
  (back ? before.at(-1) : after[0])?.focus();
}

/** The rectangle of the selection on screen, from the browser's own selection when it has one */
function selectionRect(view: EditorView, from: number, to: number): DOMRect {
  const sel = document.getSelection();
  if (sel?.rangeCount && view.dom.contains(sel.anchorNode)) {
    const r = sel.getRangeAt(0).getBoundingClientRect();
    if (r.width || r.height) return r;
  }
  const a = view.coordsAtPos(from);
  const b = view.coordsAtPos(to, -1);
  return new DOMRect(Math.min(a.left, b.left), Math.min(a.top, b.top), Math.abs(b.right - a.left), Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top));
}

/** A rectangle as an anchor for Floating */
const at = (r: DOMRect | null | undefined) => (r ? { getBoundingClientRect: () => r } : null);

/** Whether a rectangle shows inside a scrolling element (and the window): popovers anchored to it hide when it scrolls away */
function useInView(active: boolean, rect: () => DOMRect | null, container: RefObject<HTMLElement | null>) {
  const [ok, setOk] = useState(true);
  const getRect = useRef(rect);
  useLayoutEffect(() => {
    getRect.current = rect;
  });
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const check = () => {
      const r = getRect.current();
      const c = container.current?.getBoundingClientRect();
      if (!r || !c) return;
      const top = Math.max(c.top, 0);
      const bottom = Math.min(c.bottom, window.innerHeight);
      setOk(r.bottom >= top - 1 && r.top <= bottom + 1);
    };
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    };
    later();
    window.addEventListener("scroll", later, { capture: true, passive: true });
    window.addEventListener("resize", later);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", later, { capture: true });
      window.removeEventListener("resize", later);
    };
  }, [active, container]);
  return ok || !active;
}

// ------------------------------------------------------------------------------------------
// Before Milkdown has loaded (and on the server): the text laid out roughly as it will be

const strip = (s: string) =>
  s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|~~|`)/g, "")
    .replace(/(^|\W)[*_](\S)/g, "$1$2")
    .replace(/(\S)[*_](\W|$)/g, "$1$2")
    .replace(/\\([\\`*_{}[\]()#+.!|$-])/g, "$1");

// TeX about as wide and tall as KaTeX will draw it, without loading KaTeX: a command is one
// letter, scripts and inline fractions (the longer half) are small, and fractions and big
// operators make room for their height
/**
 * Follows a link: the rest in a new tab, one to `#somewhere` in place. That goes through
 * pushState (so a client router such as Next's hears of it) with the hashchange a hash router
 * listens for, and scrolls to its target as the browser would.
 */
function followLink(href: string) {
  if (!href.startsWith("#")) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  const oldURL = window.location.href;
  if (window.location.hash !== href) {
    window.history.pushState(null, "", href);
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
  }
  document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView();
}

function roughTex(tex: string): ReactNode[] {
  const flat = tex
    .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_, a: string, b: string) => `_{${a.length > b.length ? a : b}}`)
    .replace(/\\(text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, "$2")
    .replace(/\\[a-zA-Z]+/g, "x");
  const bare = (s: string) => s.replace(/[{}^_\\]/g, "");
  return flat.split(/[_^](\{[^{}]*\}|\\?.)/).map((part, n) =>
    n % 2 ? (
      <span key={n} className="text-[0.7em]">
        {bare(part)}
      </span>
    ) : (
      bare(part)
    ),
  );
}
const tallTex = (tex: string) => /\\([dt]?frac|sum|int|prod|sqrt|binom|begin|over\b)/.test(tex);

/** A line's text with its markers taken out, inline math in KaTeX's type */
function roughInline(s: string): ReactNode[] {
  return s.split(/(?<![\\$])\$([^$\n]+?)(?<!\\)\$(?!\$)/g).map((part, n) =>
    n % 2 ? (
      <span key={n} data-math="inline">
        <span className={cn("katex", tallTex(part) && "inline-block h-[1.2em] align-[-0.4em]")}>{roughTex(part)}</span>
      </span>
    ) : (
      strip(part)
    ),
  );
}

/**
 * Block by block, markers taken out, pictures kept (they decide the height). The blocks have the
 * same shape as the editor's own (items wrap a paragraph, a task item is a row with its checkbox,
 * math is in KaTeX's boxes), so the surface's rules size them alike and nothing moves on mount.
 */
function Rough({ markdown }: { markdown: string }) {
  const out: ReactNode[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  const key = () => out.length;
  const images = (s: string) =>
    [...s.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)]
      .filter((m) => safeHref(m[2], true) && !m[2].startsWith("#"))
      .map((m, n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={n} src={m[2]} alt={m[1]} />
      ));
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = /^\s*(```|~~~|\$\$)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      const tex = body.join(" ");
      out.push(
        fence[1] === "$$" ? (
          <div key={key()} data-math="block">
            <div data-math-render="">
              <span className="katex-display">
                <span className={cn("katex", tallTex(tex) && "min-h-[2.2em]")}>{roughTex(tex)}</span>
              </span>
            </div>
          </div>
        ) : (
          <pre key={key()}>
            <code>{body.join("\n")}</code>
          </pre>
        ),
      );
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const Tag = `h${h[1].length}` as "h1";
      out.push(<Tag key={key()}>{roughInline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push(<hr key={key()} />);
      i++;
      continue;
    }
    if (line.trimStart().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        if (!/^\s*\|?\s*:?-{2,}/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => strip(c.trim())));
        i++;
      }
      out.push(
        <table key={key()}>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n}>{r.map((c, m) => (n === 0 ? <th key={m}>{c}</th> : <td key={m}>{c}</td>))}</tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }
    const item = /^\s*([-*+]|\d+[.)])\s+/;
    if (item.test(line)) {
      const ordered = /\d/.test(item.exec(line)![1]);
      const items: string[] = [];
      while (i < lines.length && lines[i].trim() && (item.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (item.test(lines[i])) items.push(lines[i].replace(item, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const List = ordered ? "ol" : "ul";
      out.push(
        <List key={key()}>
          {items.map((t, n) => {
            const task = /^\[([ xX])\]\s/.exec(t);
            const text = <p>{roughInline(task ? t.slice(task[0].length) : t)}</p>;
            return task ? (
              <li key={n} className="task-list-item" data-item-type="task">
                <span data-task="">
                  <input type="checkbox" defaultChecked={task[1] !== " "} tabIndex={-1} />
                </span>
                <div>{text}</div>
              </li>
            ) : (
              <li key={n}>{text}</li>
            );
          })}
        </List>,
      );
      continue;
    }
    const para: string[] = [];
    const quote = line.startsWith(">");
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|~~~|\$\$|\s*\|)/.test(lines[i]) && lines[i].startsWith(">") === quote) para.push(lines[i++].replace(/^>\s?/, ""));
    const text = para.join(" ");
    const p = (
      <p key={key()}>
        {images(text)}
        {roughInline(text)}
      </p>
    );
    out.push(quote ? <blockquote key={key()}>{p}</blockquote> : p);
  }
  // The editor keeps an empty paragraph after a last block that isn't text, to type into
  const last = out.at(-1);
  if (isValidElement(last) && !/^(p|h[1-6])$/.test(String(last.type))) out.push(
      <p key={key()}>
        <br />
      </p>,
    );
  return <>{out}</>;
}

// ------------------------------------------------------------------------------------------
// The toolbar's buttons

function Tool({
  icon,
  label,
  keys,
  pressed,
  disabled,
  apple,
  onRun,
}: {
  icon: Glyph;
  label: string;
  keys?: string;
  /** A toggle when given (aria-pressed), else a plain button */
  pressed?: boolean;
  disabled?: boolean;
  apple: boolean;
  onRun: () => void;
}) {
  const shortcut = keys ? { "aria-keyshortcuts": ariaKeys(keys, apple) } : {};
  const button =
    pressed === undefined ? (
      <IconButton variant="ghost" icon={icon} label={label} disabled={disabled} onClick={onRun} {...shortcut} />
    ) : (
      <Toggle
        variant="ghost"
        icon={icon}
        label={label}
        pressed={pressed}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          onRun();
        }}
        {...shortcut}
      />
    );
  return <Tooltip content={keys ? `${label} (${keyLabel(keys, apple)})` : label}>{button}</Tooltip>;
}

/** Rows by columns, picked on a grid as in a word processor: arrows move, Enter puts the table in */
function TableSizePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [at, setAt] = useState({ r: 2, c: 2 });
  const N = 8;
  const move = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const d: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    const step = d[e.key];
    if (!step) return;
    e.preventDefault();
    const next = { r: Math.min(N - 1, Math.max(1, at.r + step[0])), c: Math.min(N - 1, Math.max(0, at.c + step[1])) };
    setAt(next);
    e.currentTarget.querySelector<HTMLElement>(`[data-cell="${next.r}-${next.c}"]`)?.focus();
  };
  return (
    <div className="flex flex-col gap-2">
      <div role="grid" aria-label="Table size" onKeyDown={move} className="grid w-max grid-cols-8 gap-0.5">
        {Array.from({ length: N }, (_, r) => (
          <div role="row" key={r} className="contents">
            {Array.from({ length: N }, (_, c) => {
              const on = r <= at.r && c <= at.c;
              const here = r === at.r && c === at.c;
              return (
                <span role="gridcell" key={c} className="contents">
                  <button
                    type="button"
                    data-cell={`${r}-${c}`}
                    tabIndex={here ? 0 : -1}
                    aria-label={`${r + 1} rows by ${c + 1} columns`}
                    disabled={r === 0}
                    onPointerEnter={() => r > 0 && setAt({ r, c })}
                    onFocus={() => r > 0 && setAt({ r, c })}
                    onClick={() => onPick(at.r + 1, at.c + 1)}
                    className={cn(
                      "size-4 border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-default",
                      on ? "border-primary bg-primary/25" : "border-input bg-background",
                      r === 0 && (on ? "bg-primary/40" : "bg-muted"),
                    )}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground tabular-nums">
        {at.r + 1} rows (one a header) × {at.c + 1} columns
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------
// What node views leave room for: a code block's language picker, math's source

function SlotView({ slot, editable }: { slot: Slot; editable: boolean }) {
  const { view, node, getPos } = slot;
  if (slot.kind === "code") {
    const lang = String(node.attrs.language ?? "");
    const options = [{ value: "", label: "Plain text" }, ...(lang && !LANGUAGES.includes(lang) ? [{ value: lang, label: lang }] : []), ...LANGUAGES.map((l) => ({ value: l, label: l }))];
    return (
      <div className="ctl-xs flex items-center justify-between gap-2 px-1 py-0.5 font-sans">
        {editable ? (
          <Select
            aria-label="Code language"
            value={lang}
            options={options}
            onChange={(e) => {
              const pos = getPos();
              if (pos != null) view.dispatch(view.state.tr.setNodeAttribute(pos, "language", e.target.value));
            }}
            className="border-transparent bg-transparent text-muted-foreground"
          />
        ) : (
          <span className="px-1 text-[12px] text-muted-foreground">{lang || "Plain text"}</span>
        )}
        <CopyButton text={node.textContent} name="code" />
      </div>
    );
  }
  if (!slot.selected || !editable) return null;
  return <MathSource slot={slot} />;
}

/** Writing a formula's TeX: Enter (inline) or Escape leaves it, as do the arrows at its ends */
function MathSource({ slot }: { slot: Slot }) {
  const { view, node, getPos } = slot;
  const display = slot.kind === "math-block";
  const [lib, setLib] = useState<typeof MilkdownLib | null>(null);
  useEffect(() => {
    void import("@/registry/plainspoken/lib/milkdown").then(setLib);
  }, []);
  const value = String(node.attrs.value ?? "");
  const pos = () => getPos() ?? -1;
  const set = (v: string) => {
    const p = pos();
    if (p >= 0) view.dispatch(view.state.tr.setNodeAttribute(p, "value", v));
  };
  const leave = (side: -1 | 1) => {
    const p = pos();
    if (p < 0 || !lib) return;
    if (!value.trim()) {
      lib.deleteNodeAt(view, p);
      view.focus();
      return;
    }
    lib.leaveNode(view, p, side);
  };
  const keys = (e: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (lib) (e.shiftKey ? lib.redoCommand : lib.undoCommand)(view);
      return;
    }
    if (e.key === "Escape" || (e.key === "Enter" && (!display || mod))) {
      e.preventDefault();
      leave(1);
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && t.selectionStart === 0 && t.selectionEnd === 0 && (e.key === "ArrowLeft" || display)) {
      e.preventDefault();
      leave(-1);
    } else if ((e.key === "ArrowRight" || e.key === "ArrowDown") && t.selectionStart === t.value.length && (e.key === "ArrowRight" || display)) {
      e.preventDefault();
      leave(1);
    } else if (e.key === "Backspace" && !t.value) {
      e.preventDefault();
      leave(-1);
    }
  };
  if (display)
    return (
      <Textarea
        aria-label="Formula, in TeX"
        autoFocus
        value={value}
        rows={Math.max(2, value.split("\n").length)}
        placeholder="\int_0^1 x^2 \, dx"
        spellCheck={false}
        onChange={(e) => set(e.target.value)}
        onKeyDown={keys}
        className="resize-none font-mono text-[13px]"
      />
    );
  return (
    <Input
      size="xs"
      aria-label="Formula, in TeX"
      autoFocus
      value={value}
      placeholder="x^2"
      spellCheck={false}
      prefix="$"
      suffix="$"
      onChange={(e) => set(e.target.value)}
      onKeyDown={keys}
      inputClassName="font-mono [field-sizing:content] min-w-12"
      className="align-baseline"
    />
  );
}

function Slots({ store, editable }: { store: SlotStore; editable: boolean }) {
  const slots = useSyncExternalStore(store.subscribe, store.get, store.get);
  return slots.map((s) => createPortal(<SlotView slot={s} editable={editable} />, s.mount, String(s.key)));
}

// ------------------------------------------------------------------------------------------
// The block menu, from the handle and from the toolbar's ⋯

type BlockAction = { type: "turn"; into: TurnInto } | { type: "move"; dir: -1 | 1 } | { type: "duplicate" } | { type: "delete" };

const TURN_INTO: { into: TurnInto; label: string; icon: Glyph }[] = [
  { into: "p", label: "Text", icon: Pilcrow },
  { into: "h1", label: "Heading 1", icon: Heading1 },
  { into: "h2", label: "Heading 2", icon: Heading2 },
  { into: "h3", label: "Heading 3", icon: Heading3 },
  { into: "ul", label: "Bulleted list", icon: List },
  { into: "ol", label: "Numbered list", icon: ListOrdered },
  { into: "task", label: "Task list", icon: ListChecks },
  { into: "quote", label: "Quote", icon: Quote },
  { into: "pre", label: "Code block", icon: SquareCode },
];

const BLOCK_ACTIONS: ({ type: "separator" } | { label: string; icon: Glyph; mac?: string; pc?: string; destructive?: boolean; action: BlockAction })[] = [
  { label: "Move up", icon: ArrowUp, mac: "⌥⇧↑", pc: "Alt+Shift+↑", action: { type: "move", dir: -1 } },
  { label: "Move down", icon: ArrowDown, mac: "⌥⇧↓", pc: "Alt+Shift+↓", action: { type: "move", dir: 1 } },
  { label: "Duplicate", icon: CopyPlus, action: { type: "duplicate" } },
  { type: "separator" },
  { label: "Delete", icon: Trash, destructive: true, action: { type: "delete" } },
];

// ------------------------------------------------------------------------------------------
// The text's look: Prose's typography, and ProseMirror's own base styles redone in tokens

const SURFACE = cn(
  // ProseMirror's base CSS (prosemirror.css), restyled
  "[&_.ProseMirror]:relative [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:[white-space:break-spaces] [&_.ProseMirror]:[font-variant-ligatures:none] [&_.ProseMirror]:outline-none",
  "[&_.ProseMirror_li]:relative [&_.ProseMirror_pre_code]:whitespace-pre",
  "[&_.ProseMirror-hideselection_*]:selection:bg-transparent [&_.ProseMirror-hideselection]:caret-transparent",
  "[&_[draggable][contenteditable=false]]:select-text",
  "[&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&_.ProseMirror-selectednode]:outline-ring",
  "[&_img.ProseMirror-separator]:inline! [&_img.ProseMirror-separator]:m-0! [&_img.ProseMirror-separator]:border-0!",
  "selection:bg-link/25",
  // The gap cursor (a line where the caret sits between two blocks) and the drop indicator
  "[&_.ProseMirror-gapcursor]:pointer-events-none [&_.ProseMirror-gapcursor]:absolute [&_.ProseMirror-gapcursor]:hidden [&_.ProseMirror-focused_.ProseMirror-gapcursor]:block",
  "[&_.ProseMirror-gapcursor]:after:absolute [&_.ProseMirror-gapcursor]:after:-top-0.5 [&_.ProseMirror-gapcursor]:after:block [&_.ProseMirror-gapcursor]:after:w-5 [&_.ProseMirror-gapcursor]:after:border-t-2 [&_.ProseMirror-gapcursor]:after:border-foreground [&_.ProseMirror-gapcursor]:after:content-['']",
  "[&_.milkdown-drop-indicator]:z-10 [&_.milkdown-drop-indicator]:bg-ring",
  // prosemirror-tables: selected cells
  "[&_:where(td,th)>p]:m-0 [&_:where(td,th)]:relative [&_.selectedCell]:after:pointer-events-none [&_.selectedCell]:after:absolute [&_.selectedCell]:after:inset-0 [&_.selectedCell]:after:bg-link/15 [&_.selectedCell]:after:content-['']",
  // The placeholder, and the hint on an empty line being written
  "[&_[data-placeholder]]:before:pointer-events-none [&_[data-placeholder]]:before:float-left [&_[data-placeholder]]:before:h-0 [&_[data-placeholder]]:before:text-muted-foreground [&_[data-placeholder]]:before:content-[attr(data-placeholder)]",
  "[&_.ProseMirror-focused_[data-hint]]:before:pointer-events-none [&_.ProseMirror-focused_[data-hint]]:before:float-left [&_.ProseMirror-focused_[data-hint]]:before:h-0 [&_.ProseMirror-focused_[data-hint]]:before:text-muted-foreground [&_.ProseMirror-focused_[data-hint]]:before:content-[attr(data-hint)]",
  // Task items (li.task-list-item): Prose puts the checkbox where the bullet would be; here the
  // text beside it is a block of its own, so the item is a row
  "[&_li[data-item-type=task]]:flex [&_li[data-item-type=task]>div]:min-w-0 [&_li[data-item-type=task]>div]:flex-1 [&_li[data-item-type=task]>div>p]:mb-[0.4em]",
  "[&_[data-task]]:shrink-0 [&_[data-task]]:select-none [&_[data-task]_input]:cursor-pointer",
  "[&_.ProseMirror[contenteditable=false]_[data-task]_input]:pointer-events-none",
  // Pictures: selected, uploading
  "[&_img]:cursor-default [&_img[data-selected]]:outline-2 [&_img[data-selected]]:outline-offset-2 [&_img[data-selected]]:outline-ring",
  "[&_img[data-uploading]]:opacity-50 [&_img[data-uploading]]:outline-1 [&_img[data-uploading]]:outline-border [&_img[data-uploading]]:outline-dashed",
  // Code blocks: Prose's box, with the language picker as its header
  "[&_[data-code-block]]:mb-[0.75em] [&_[data-code-block]]:border [&_[data-code-block]]:border-border [&_[data-code-block]]:bg-muted",
  "[&_[data-code-header]]:border-b [&_[data-code-header]]:border-border/60 [&_[data-code-block]>pre]:m-0 [&_[data-code-block]>pre]:border-0 [&_[data-code-block]>pre]:bg-transparent",
  // Math: KaTeX, its rules in the text colour rather than the border colour
  "[&_.katex_*]:border-current [&_.katex]:text-[1.05em] [&_.katex-display]:my-0! [&_[data-math]]:cursor-default [&_[data-math-render][data-empty]]:text-muted-foreground [&_[data-math-render][data-empty]]:italic",
  "[&_[data-math=block]]:mb-[0.75em] [&_[data-math=block]]:flex [&_[data-math=block]]:flex-col [&_[data-math=block]]:gap-1.5 [&_[data-math=block]]:overflow-x-auto [&_[data-math=block]]:py-[0.2em] [&_[data-math=block]>[data-math-render]]:text-center [&_[data-math-source]:empty]:hidden [&_[data-math=block]>[data-math-source]]:order-first",
  "[&_.ProseMirror[contenteditable=true]_[data-math=inline][data-selected]>[data-math-render]]:hidden [&_.ProseMirror[contenteditable=true]_[data-math].ProseMirror-selectednode]:outline-none",
  // Footnotes, like Prose's: references in brackets, definitions small under a rule
  "[&_sup[data-type$=reference]]:text-link [&_sup[data-type$=reference]]:before:content-['['] [&_sup[data-type$=reference]]:after:content-[']']",
  "[&_dl[data-type$=definition]]:mb-[0.4em] [&_dl[data-type$=definition]]:flex [&_dl[data-type$=definition]]:gap-[0.5em] [&_dl[data-type$=definition]]:text-[0.85em] [&_dl[data-type$=definition]]:text-muted-foreground",
  "[&_:not(dl)+dl[data-type$=definition]]:mt-[1.5em] [&_:not(dl)+dl[data-type$=definition]]:border-t [&_:not(dl)+dl[data-type$=definition]]:border-border [&_:not(dl)+dl[data-type$=definition]]:pt-[0.4em]",
  "[&_dl[data-type$=definition]>dt]:font-normal [&_dl[data-type$=definition]>dt]:after:content-['.'] [&_dl[data-type$=definition]>dd]:min-w-0 [&_dl[data-type$=definition]>dd]:flex-1 [&_dl[data-type$=definition]>dd>p]:mb-0",
  // Raw HTML in the Markdown is shown as text
  "[&_span[data-type=html]]:font-mono [&_span[data-type=html]]:text-[0.875em] [&_span[data-type=html]]:text-muted-foreground",
);

// ------------------------------------------------------------------------------------------

/**
 * A rich text editor whose text is Markdown, built on Milkdown (ProseMirror and remark) and drawn
 * entirely with this library's components: a drop-in alternative to RichTextEditor, with the same
 * props, modes and handle. Write mode is Milkdown; Markdown mode is the source in a Textarea;
 * Preview is the same Milkdown view, read only and without the chrome. Every mode reads and writes
 * one Markdown string; Write mode rewrites the source tidily only once you change something in it.
 *
 * Write mode is a ProseMirror editable with role="textbox", and a toolbar per the ARIA toolbar
 * pattern (one Tab stop; ←/→, Home and End between its controls) whose state follows the caret.
 * Keys (⌘ on Apple devices, Ctrl elsewhere): ⌘B bold, ⌘I italic, ⇧⌘X strikethrough, ⌘E code,
 * ⌘K link, ⇧⌘7 numbered, ⇧⌘8 bulleted, ⇧⌘9 task list, ⌥⌘0–6 paragraph and headings, ⌘Z undo,
 * ⇧⌘Z or ⌘Y redo, ⌘Enter ticks a task, ⌥⇧↑ and ⌥⇧↓ move the block. Tab and ⇧Tab indent list items
 * and move between table cells (Tab in the last cell adds a row); press Esc first to Tab out of
 * the editor instead. Markdown typed at a line's start turns into its block ("# ", "- ", "1. ",
 * "[ ] ", "> ", ``` and $$ then Enter or a space, ---), and inline Markdown into its formatting
 * (**bold**, `code`, ~~struck~~, $math$, [words](address), and web addresses followed by a space).
 *
 * "/" at the start of a line opens a menu of every block (↑/↓, Enter, Esc; type to filter).
 * Selecting words shows a bubble for inline formatting; the caret in a link shows its address
 * with Edit and Remove. Hovering a block shows a handle: drag it to move the block, or click it
 * for Turn into, Move, Duplicate and Delete (all also in the toolbar's ⋯ menu, for the keyboard).
 * In a table a small toolbar adds and removes rows and columns and aligns columns; math ($…$ and
 * $$…$$, through remark-math) shows as KaTeX and opens its TeX source when selected.
 *
 * Pictures: the toolbar's image button (a file, or an address), pasting, or dropping. With
 * onUploadImage each one shows faded, with progress under the text, until its URL comes back;
 * meanwhile the Markdown says `![alt](#uploading-…)`. Select a picture to write its alt text or
 * remove it. A new `value` from outside changes only what differs, keeping the caret and the undo
 * history. Milkdown loads in the browser after the page; until then the text shows laid out
 * roughly as it will be. Inside a Field it takes the label, hint and error like Input does.
 */
export function MilkdownEditor({
  value: valueProp,
  defaultValue = "",
  onChange,
  mode: modeProp,
  defaultMode = "write",
  onModeChange,
  placeholder,
  disabled = false,
  readOnly = false,
  invalid,
  required,
  size,
  onUploadImage,
  name,
  id,
  editorRef,
  contentClassName,
  measure = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: MilkdownEditorProps) {
  const f = useFieldProps({ id, invalid, required });
  const field = useField();
  const autoId = useId();
  const textboxId = f.id ?? `${autoId}-text`;
  const slashId = `${autoId}-slash`;
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
  const describedBy = [f["aria-describedby"], ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  const apple = useApple();

  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = valueProp ?? ownValue;
  const [ownMode, setOwnMode] = useState<EditorMode>(defaultMode);
  const mode = modeProp ?? ownMode;
  const editable = !disabled && !readOnly && mode === "write";

  const [ready, setReady] = useState(false);
  const [slots, setSlots] = useState<SlotStore | null>(null);
  const [fmt, setFmt] = useState<Formats>(NO_FORMATS);
  const [around, setAround] = useState<Around>(NOTHING);
  const [focused, setFocused] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [floatFocus, setFloatFocus] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashDismissed, setSlashDismissed] = useState<number | null>(null);
  const [handle, setHandle] = useState<{ at: ActiveNode; top: number; left: number } | null>(null);
  const [handleMenu, setHandleMenu] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [link, setLink] = useState<LinkDraft | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; key: number }>({ open: false, key: 0 });
  const [tableOpen, setTableOpen] = useState(false);
  const [said, setSaid] = useState("");

  const box = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const lib = useRef<typeof MilkdownLib | null>(null);
  const md = useRef<MilkdownInstance | null>(null);
  /** The newest Markdown, ahead of the next render */
  const latest = useRef(value);
  /** The Markdown the Milkdown document shows */
  const synced = useRef(value);
  const emitQueued = useRef(false);
  const escaped = useRef(false);
  const lastTool = useRef<HTMLElement | null>(null);
  const pointerPick = useRef(false);
  const handleBlock = useRef<BlockAt | null>(null);
  /** Which block the block menu acts on: the handle's, or the caret's (from the toolbar) */
  const menuSource = useRef<"handle" | "caret">("caret");
  const controllers = useRef(new Map<string, AbortController>());
  const locals = useRef(new Map<string, string>());
  const finals = useRef(new Map<string, string>());

  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);

  const say = (text: string) => setSaid((s) => (s === text ? `${text} ` : text));
  const view = () => md.current?.view ?? null;

  const emit = (markdown: string) => {
    if (markdown === latest.current) return;
    latest.current = markdown;
    setOwnValue(markdown);
    onChange?.(markdown);
  };

  // ------------------------------------------------------------------------------------------
  // What Milkdown calls back (through a ref, so it always reaches this render's state)

  const onUpdate = (v: EditorView) => {
    const L = lib.current;
    if (!L) return;
    const st = v.state;
    const next = L.readFormats(st);
    setFmt((p) => (sameFormats(p, next) ? p : next));
    const sel = st.selection;
    const image = next.image ? sel.from : null;
    const table = L.tableAt(st);
    const slash = L.slashAt(st);
    const a: Around = {
      range: !sel.empty && !next.image && !table && sel.$from.parent.inlineContent && !sel.$from.parent.type.spec.code && sel.constructor.name !== "NodeSelection",
      link: sel.empty || !next.image ? L.linkAt(st) : null,
      image,
      imageAlt: next.image ? String(st.doc.nodeAt(sel.from)?.attrs.alt ?? "") : "",
      table: table?.pos ?? null,
      slash,
      align: table ? L.columnAlign(st) : null,
    };
    setAround((p) => (sameAround(p, a) ? p : a));
    if (!slash) setSlashDismissed(null);
  };

  const onChanged = () => {
    if (emitQueued.current) return;
    emitQueued.current = true;
    queueMicrotask(() => {
      emitQueued.current = false;
      const inst = md.current;
      if (!inst) return;
      const m = inst.markdown();
      synced.current = m;
      emit(m);
    });
  };

  const attributes = (): Record<string, string> => {
    const a: Record<string, string> = { "aria-multiline": "true", spellcheck: "true", "data-milkdown-input": "", class: "focus-visible:outline-none" };
    if (mode !== "markdown") a.id = textboxId;
    if (ariaLabel) a["aria-label"] = ariaLabel;
    if (labelledBy) a["aria-labelledby"] = labelledBy;
    if (describedBy) a["aria-describedby"] = describedBy;
    if (f["aria-invalid"]) a["aria-invalid"] = "true";
    if (f.required) a["aria-required"] = "true";
    if (readOnly || mode === "preview") a["aria-readonly"] = "true";
    if (disabled) a["aria-disabled"] = "true";
    if (placeholder) a["aria-placeholder"] = placeholder;
    if (!editable && !disabled) a.tabindex = "0";
    return a;
  };

  const onBlock = (active: ActiveNode | null) => {
    if (handleMenu) return;
    if (!active) {
      setHandle(null);
      return;
    }
    const wrap = surface.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const el = active.el;
    const e = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 20;
    const x = el.tagName === "LI" && el.parentElement ? el.parentElement.getBoundingClientRect().left : e.left;
    setHandle({ at: active, top: Math.round(e.top - r.top + (parseFloat(cs.paddingTop) || 0) + line / 2 - 10), left: Math.max(2, Math.round(x - r.left - 24)) });
  };

  // A <label for> can't focus a contenteditable by itself
  useEffect(() => {
    if (mode === "markdown") return;
    const label = document.querySelector(`label[for="${CSS.escape(textboxId)}"]`);
    const onClick = () => view()?.focus();
    label?.addEventListener("click", onClick);
    return () => label?.removeEventListener("click", onClick);
  }, [mode, textboxId]);

  // The Markdown box grows with its text (field-sizing isn't everywhere yet: this is for the rest)
  useLayoutEffect(() => {
    const t = textarea.current;
    if (!t || mode !== "markdown" || CSS.supports("field-sizing", "content")) return;
    t.style.minHeight = "0px";
    t.style.height = "0px";
    t.style.flex = "none";
    const h = t.scrollHeight;
    t.style.height = "";
    t.style.flex = "";
    t.style.minHeight = `${h + 2}px`;
  }, [mode, value]);

  const linkOpen = link != null;
  useEffect(() => {
    if (linkOpen) linkInput.current?.focus();
  }, [linkOpen]);

  useEffect(() => {
    if (!pointerDown) return;
    const up = () => setPointerDown(false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [pointerDown]);

  // ------------------------------------------------------------------------------------------
  // Commands from the chrome: focus back in the text first, then the change

  const act = (fn: (v: EditorView, L: typeof MilkdownLib) => unknown, refocus = true) => {
    const v = view();
    const L = lib.current;
    if (!v || !L || !editable) return;
    const back = toolbar.current?.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    fn(v, L);
    if (refocus && !back) v.focus();
    back?.focus({ preventScroll: true });
  };

  const openLink = () => {
    const v = view();
    const L = lib.current;
    if (!v || !L || !editable) return;
    const st = v.state;
    if (st.selection.$from.parent.type.spec.code) return;
    const range = L.linkAt(st);
    const text = range ? st.doc.textBetween(range.from, range.to) : st.doc.textBetween(st.selection.from, st.selection.to, " ");
    setLink({ href: range?.href ?? "", text, range, askText: !range && st.selection.empty });
  };

  const closeLink = () => {
    setLink(null);
    const active = document.activeElement;
    if (!active || active === document.body || active.closest("[data-milkdown-link]")) view()?.focus();
  };

  const applyLink = (e: FormEvent) => {
    e.preventDefault();
    if (!link) return;
    const href = normalizeHref(link.href);
    if (!href || !safeHref(href)) {
      setLink({ ...link, error: "Use a web address (https://…), an email address, or a link within the site." });
      return;
    }
    const draft = link;
    setLink(null);
    act((v, L) => L.applyLink(v, href, draft.text.trim(), draft.range));
  };

  const linkAnchor = () => {
    const v = view();
    if (!v) return null;
    const r = link?.range ?? around.link;
    const sel = v.state.selection;
    return selectionRect(v, r?.from ?? sel.from, r?.to ?? sel.to);
  };

  // ------------------------------------------------------------------------------------------
  // Pictures

  /** A picture's Markdown at the text box's caret, on a line of its own */
  const insertIntoSource = (markdown: string) => {
    const t = textarea.current;
    if (!t) {
      emit(latest.current ? `${latest.current}\n\n${markdown}` : markdown);
      return;
    }
    const v = t.value;
    const s = t.selectionStart;
    const e = t.selectionEnd;
    const before = v.slice(0, s);
    const after = v.slice(e);
    const pre = !before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const post = !after || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    t.focus();
    t.setSelectionRange(s, e);
    if (!document.execCommand("insertText", false, pre + markdown + post)) {
      t.setRangeText(pre + markdown + post, s, e, "end");
      emit(t.value);
    }
  };

  const placeImage = (src: string, alt: string) => {
    if (mode !== "write") {
      insertIntoSource(imageMarkdown(alt, src));
      return;
    }
    act((v, L) => L.insertImage(v, src, alt));
  };

  /** Images whose src is the placeholder get `src`, or go when it is null; not an undo step */
  const replacePlaceholder = (placeholder: string, src: string | null) => {
    const v = view();
    if (v && synced.current === latest.current && mode !== "markdown") {
      const tr = v.state.tr;
      const hits: { pos: number; size: number; attrs: Record<string, unknown> }[] = [];
      v.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === placeholder) hits.push({ pos, size: node.nodeSize, attrs: node.attrs });
      });
      for (const h of hits.reverse()) {
        if (src == null) tr.delete(h.pos, h.pos + h.size);
        else tr.setNodeAttribute(h.pos, "src", src);
      }
      if (hits.length) v.dispatch(tr.setMeta("addToHistory", false));
      return;
    }
    const md0 = latest.current;
    if (src != null) emit(md0.split(`](${placeholder})`).join(`](${markdownUrl(src)})`));
    else emit(md0.replace(new RegExp(`(\\n\\n)?!\\[(?:[^\\]\\\\]|\\\\.)*\\]\\(${placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"), ""));
  };

  const finishUpload = (id: string, url: string, fileName: string) => {
    controllers.current.delete(id);
    finals.current.set(id, url);
    setUploads((u) => u.filter((x) => x.id !== id));
    replacePlaceholder(UPLOADING_PREFIX + id, url);
    say(`${fileName} uploaded`);
  };

  const failUpload = (id: string, fileName: string, error: string | null) => {
    controllers.current.delete(id);
    setUploads((u) => (error ? u.map((x) => (x.id === id ? { ...x, error, progress: null } : x)) : u.filter((x) => x.id !== id)));
    replacePlaceholder(UPLOADING_PREFIX + id, null);
    say(error ? `Couldn't upload ${fileName}: ${error}` : `Upload of ${fileName} canceled`);
  };

  /**
   * Starts a picture: an object URL without onUploadImage, else a placeholder shown faded while it
   * uploads. With `only`, it gives back what to put in rather than putting it in (paste and drop).
   */
  const startUpload = (file: File, alt = altFromName(file.name), only = false): { src: string; alt: string } | undefined => {
    if (!isImageFile(file)) return undefined;
    const local = URL.createObjectURL(file);
    if (!onUploadImage) {
      if (only) return { src: local, alt };
      placeImage(local, alt);
      return undefined;
    }
    const uid = uploadId();
    locals.current.set(uid, local);
    const controller = new AbortController();
    controllers.current.set(uid, controller);
    setUploads((u) => [...u, { id: uid, name: file.name, progress: null, local }]);
    say(`Uploading ${file.name}`);
    onUploadImage(file, {
      signal: controller.signal,
      onProgress: (p) => setUploads((u) => u.map((x) => (x.id === uid ? { ...x, progress: Math.max(x.progress ?? 0, Math.min(1, p)) } : x))),
    }).then(
      (url) => {
        if (!controller.signal.aborted) finishUpload(uid, url, file.name);
      },
      (err: unknown) => failUpload(uid, file.name, controller.signal.aborted ? null : err instanceof Error && err.message ? err.message : "the upload failed"),
    );
    if (only) return { src: UPLOADING_PREFIX + uid, alt };
    placeImage(UPLOADING_PREFIX + uid, alt);
    return undefined;
  };

  const cancelUpload = (uid: string) => {
    const c = controllers.current.get(uid);
    const u = uploads.find((x) => x.id === uid);
    c?.abort();
    if (u) failUpload(uid, u.name, null);
  };

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((c) => c.abort());
  }, []);

  useImperativeHandle(editorRef, () => ({
    focus: () => (mode === "markdown" ? textarea.current?.focus() : view()?.focus()),
    insertImage: (file: File, alt?: string) => void startUpload(file, alt),
    insertImageUrl: (url: string, alt = "") => placeImage(url, alt),
  }));

  // ------------------------------------------------------------------------------------------
  // The slash menu

  interface SlashItem {
    label: string;
    icon: Glyph;
    /** The Markdown that makes it, shown on the right */
    hint?: string;
    keywords: string;
    run: (v: EditorView, L: typeof MilkdownLib) => unknown;
  }
  const SLASH: SlashItem[] = [
    { label: "Text", icon: Pilcrow, keywords: "paragraph plain", run: (v, L) => L.setTextStyle(v, "p") },
    { label: "Heading 1", icon: Heading1, hint: "#", keywords: "title h1", run: (v, L) => L.setTextStyle(v, "h1") },
    { label: "Heading 2", icon: Heading2, hint: "##", keywords: "subtitle h2", run: (v, L) => L.setTextStyle(v, "h2") },
    { label: "Heading 3", icon: Heading3, hint: "###", keywords: "h3", run: (v, L) => L.setTextStyle(v, "h3") },
    { label: "Bulleted list", icon: List, hint: "-", keywords: "unordered bullets ul", run: (v, L) => L.toggleList(v, "ul") },
    { label: "Numbered list", icon: ListOrdered, hint: "1.", keywords: "ordered ol", run: (v, L) => L.toggleList(v, "ol") },
    { label: "Task list", icon: ListChecks, hint: "[ ]", keywords: "todo checkbox checklist", run: (v, L) => L.toggleList(v, "task") },
    { label: "Quote", icon: Quote, hint: ">", keywords: "blockquote citation", run: (v, L) => L.toggleQuote(v) },
    { label: "Code block", icon: SquareCode, hint: "```", keywords: "pre snippet source", run: (v, L) => L.toggleCodeBlock(v, true) },
    { label: "Table", icon: Table, hint: "|3x3|", keywords: "grid rows columns", run: (v, L) => L.insertTable(v, 3, 3) },
    { label: "Image", icon: ImagePlus, keywords: "picture photo upload", run: () => setDialog((d) => ({ open: true, key: d.key + 1 })) },
    { label: "Math block", icon: SquareSigma, hint: "$$", keywords: "formula equation tex katex", run: (v, L) => L.insertMath(v, true) },
    { label: "Inline math", icon: Sigma, hint: "$…$", keywords: "formula equation tex katex", run: (v, L) => L.insertMath(v, false) },
    { label: "Divider", icon: SeparatorHorizontal, hint: "---", keywords: "horizontal rule hr line", run: (v, L) => L.insertRule(v) },
  ];
  const q = around.slash?.query.toLowerCase() ?? "";
  const words = (t: string) => t.toLowerCase().split(/[\s-]+/);
  const slashItems = SLASH.filter((it) => !q || it.label.toLowerCase().includes(q) || words(it.keywords).some((w) => w.startsWith(q)));
  const slashOpen = !!around.slash && editable && focused && slashDismissed !== around.slash.from;
  const slashActive = slashItems.length ? Math.min(slashIndex, slashItems.length - 1) : -1;

  const chooseSlash = (it: SlashItem) => {
    const at = around.slash;
    act((v, L) => {
      if (at) L.clearSlash(v, at);
      it.run(v, L);
    });
    setSlashIndex(0);
  };

  const [slashQuery, setSlashQuery] = useState(q);
  if (q !== slashQuery) {
    setSlashQuery(q);
    setSlashIndex(0);
  }

  useEffect(() => {
    if (slashOpen && slashActive >= 0) document.getElementById(`${slashId}-${slashActive}`)?.scrollIntoView({ block: "nearest" });
  }, [slashOpen, slashActive, slashId]);

  // The editable says which option is active, as a combobox would
  useLayoutEffect(() => {
    const dom = view()?.dom;
    if (!dom) return;
    if (slashOpen) {
      dom.setAttribute("aria-controls", slashId);
      dom.setAttribute("aria-expanded", "true");
      dom.setAttribute("aria-autocomplete", "list");
      if (slashActive >= 0) dom.setAttribute("aria-activedescendant", `${slashId}-${slashActive}`);
      else dom.removeAttribute("aria-activedescendant");
    } else {
      for (const a of ["aria-controls", "aria-expanded", "aria-autocomplete", "aria-activedescendant"]) dom.removeAttribute(a);
    }
  }, [slashOpen, slashActive, slashId]);

  // ------------------------------------------------------------------------------------------
  // The block handle and the block menu

  /** Runs a block menu action on the block under the handle, or (from the toolbar) the one the caret is in */
  const runBlock = (action: BlockAction) => {
    const v0 = md.current?.view;
    const b = menuSource.current === "handle" ? handleBlock.current : v0 && lib.current ? lib.current.blockAt(v0.state) : null;
    if (!b) return;
    act((v, L) => {
      if (action.type === "turn") L.turnInto(v, b, action.into);
      else if (action.type === "move") L.moveBlock(v, action.dir, b);
      else if (action.type === "duplicate") L.duplicateBlock(v, b);
      else L.deleteBlock(v, b);
    });
  };
  const blockItems: MenuItem[] = [
    { type: "submenu", label: "Turn into", icon: Pilcrow, items: TURN_INTO.map((t) => ({ label: t.label, icon: t.icon, onSelect: () => runBlock({ type: "turn", into: t.into }) })) },
    { type: "separator" },
    ...BLOCK_ACTIONS.map((a): MenuItem => ("action" in a ? { label: a.label, icon: a.icon, shortcut: apple ? a.mac : a.pc, destructive: a.destructive, onSelect: () => runBlock(a.action) } : a)),
  ];

  // ------------------------------------------------------------------------------------------
  // Keys, before anything else sees them

  const onKeyDown = (v: EditorView, e: KeyboardEvent): boolean => {
    const L = lib.current;
    if (!L) return false;
    const mod = apple ? e.metaKey : e.ctrlKey;
    if (slashOpen) {
      const items = slashItems;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (items.length) setSlashIndex((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
        return true;
      }
      if ((e.key === "Enter" || e.key === "Tab") && items.length) {
        chooseSlash(items[Math.min(slashIndex, items.length - 1)]);
        return true;
      }
      if (e.key === "Escape") {
        setSlashDismissed(around.slash?.from ?? null);
        return true;
      }
    }
    if (!["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) escaped.current = e.key === "Escape";
    if (e.key === "Escape") {
      if (link) setLink(null);
      return false;
    }
    if (e.key === "Tab" && escaped.current) {
      escaped.current = false;
      focusPast(v.dom, e.shiftKey);
      return true;
    }
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
      openLink();
      return true;
    }
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "u") return true;
    return L.editingKeys(v, e);
  };

  const handlers = useRef({ onUpdate, onChanged, attributes, onKeyDown, onBlock, editable: () => editable, placeholder: () => placeholder, startFiles: (() => []) as (files: File[]) => { src: string; alt: string }[] });
  useLayoutEffect(() => {
    handlers.current = {
      onUpdate,
      onChanged,
      attributes,
      onKeyDown,
      onBlock,
      editable: () => editable,
      placeholder: () => placeholder,
      startFiles: (files) => files.flatMap((file) => startUpload(file, undefined, true) ?? []),
    };
  });

  // ------------------------------------------------------------------------------------------
  // Milkdown: loaded and made after mounting, so the server and the first paint never need it

  useEffect(() => {
    let cancelled = false;
    let instance: MilkdownInstance | null = null;
    let root: HTMLDivElement | null = null;
    void (async () => {
      const L = await import("@/registry/plainspoken/lib/milkdown");
      if (cancelled || !mount.current) return;
      lib.current = L;
      const store = new L.SlotStore();
      const host: MilkdownHost = {
        editable: () => handlers.current.editable(),
        attributes: () => handlers.current.attributes(),
        placeholder: () => handlers.current.placeholder(),
        update: (v) => handlers.current.onUpdate(v),
        changed: () => handlers.current.onChanged(),
        // Losing focus is noted a moment later, so focus going into a popover of ours (the table
        // toolbar's menus) is seen first and the popover stays
        focus: (v, on) => {
          if (on) setFocused(true);
          else window.setTimeout(() => setFocused(v.hasFocus()), 0);
        },
        keydown: (v, e) => handlers.current.onKeyDown(v, e),
        upload: (files) => handlers.current.startFiles(files),
        imageSrc: (src) => (src.startsWith(UPLOADING_PREFIX) ? (locals.current.get(src.slice(UPLOADING_PREFIX.length)) ?? "") : src),
        uploaded: (src) => finals.current.get(src.slice(UPLOADING_PREFIX.length)),
        block: (active) => handlers.current.onBlock(active),
        openLink: (href) => {
          if (L.safeUrl(href) && href) followLink(href);
        },
        slots: store,
      };
      root = document.createElement("div");
      root.className = "contents";
      mount.current.append(root);
      const made = await L.createMilkdown(root, latest.current, host);
      if (cancelled) {
        made.destroy();
        root.remove();
        return;
      }
      instance = made;
      md.current = made;
      synced.current = latest.current;
      setSlots(store);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      instance?.destroy();
      root?.remove();
      md.current = null;
    };
  }, []);

  // A new value from outside: only what differs changes, the caret stays, and undo doesn't see it
  useLayoutEffect(() => {
    const inst = md.current;
    if (!inst || mode === "markdown" || value === synced.current) return;
    inst.setMarkdown(value);
    synced.current = value;
  }, [value, mode, ready]);

  // Editable or not, and the attributes, follow the props; node views are redrawn for read-only parts
  useLayoutEffect(() => {
    const v = view();
    if (!v) return;
    v.setProps({ nodeViews: { ...v.props.nodeViews } });
  }, [editable, ready]);
  useLayoutEffect(() => {
    view()?.setProps({});
  });

  // ------------------------------------------------------------------------------------------
  // The toolbar: one Tab stop, arrows between its controls

  const toolItems = () => [...(toolbar.current?.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), input:not(:disabled)") ?? [])];
  useLayoutEffect(() => {
    const items = toolItems();
    const current = items.find((el) => el === lastTool.current) ?? items[0];
    for (const el of items) el.tabIndex = el === current ? 0 : -1;
  });
  const onToolbarKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = toolItems();
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const n = items.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    items[next].focus();
  };
  const onToolbarFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (!toolbar.current?.contains(e.target)) return;
    lastTool.current = e.target;
    for (const el of toolItems()) el.tabIndex = el === e.target ? 0 : -1;
  };

  const changeMode = (next: EditorMode) => {
    if (next === mode) return;
    setLink(null);
    setHandle(null);
    setOwnMode(next);
    onModeChange?.(next);
    say(MODE_SAID[next]);
  };

  const off = disabled || !ready;
  const blockOptions: { value: string; label: string; disabled?: boolean }[] = [...BLOCKS];
  if (fmt.block && /^h[4-6]$/.test(fmt.block)) blockOptions.splice(4, 0, { value: fmt.block, label: `Heading ${fmt.block[1]}` });
  if (!fmt.block) blockOptions.unshift({ value: "", label: fmt.table ? "Table" : "Other", disabled: true });

  const tableItems: MenuItem[] = [
    { type: "label", label: "Row" },
    { label: "Insert row above", icon: ArrowUp, onSelect: () => act((v, L) => L.addRow("above")(v)) },
    { label: "Insert row below", icon: ArrowDown, onSelect: () => act((v, L) => L.addRow("below")(v)) },
    { label: "Delete row", icon: Trash, onSelect: () => act((v, L) => L.removeRow(v)) },
    { type: "label", label: "Column" },
    { label: "Insert column left", icon: ArrowUp, onSelect: () => act((v, L) => L.addColumn("left")(v)) },
    { label: "Insert column right", icon: ArrowDown, onSelect: () => act((v, L) => L.addColumn("right")(v)) },
    { label: "Delete column", icon: Trash, onSelect: () => act((v, L) => L.removeColumn(v)) },
    {
      type: "radio",
      label: "Align column",
      value: around.align ?? "left",
      onValueChange: (a) => act((v, L) => L.setColumnAlign(v, a as Align)),
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Centre" },
        { value: "right", label: "Right" },
      ],
    },
    { type: "separator" },
    { label: "Delete table", icon: Trash, destructive: true, onSelect: () => act((v, L) => L.removeTable(v)) },
  ];
  // Column arrows read better sideways
  tableItems[5] = { ...(tableItems[5] as object), icon: TextAlignStart } as MenuItem;
  tableItems[6] = { ...(tableItems[6] as object), icon: TextAlignEnd } as MenuItem;

  const tools: ReactNode = (
    <div
      ref={toolbar}
      role="toolbar"
      aria-label="Formatting"
      aria-controls={textboxId}
      onKeyDown={onToolbarKeyDown}
      onFocus={onToolbarFocus}
      // Buttons pressed with the mouse leave focus (and the selection) in the text
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest("select,input")) e.preventDefault();
      }}
      className="flex min-w-0 flex-wrap items-center gap-0.5"
    >
      <Select
        aria-label="Text style"
        value={fmt.block ?? ""}
        options={blockOptions}
        disabled={off}
        onPointerDown={() => (pointerPick.current = true)}
        onKeyDown={() => (pointerPick.current = false)}
        onChange={(e) => {
          // Picked with the mouse: back to the text. With the keyboard: stay, to keep choosing.
          const pointer = pointerPick.current;
          pointerPick.current = false;
          act((v, L) => L.setTextStyle(v, e.target.value as BlockKind), pointer);
        }}
      />
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={Bold} label="Bold" keys="B" pressed={fmt.bold} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("strong")(v))} />
      <Tool icon={Italic} label="Italic" keys="I" pressed={fmt.italic} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("emphasis")(v))} />
      <Tool icon={Strikethrough} label="Strikethrough" keys="Shift+X" pressed={fmt.strike} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("strike_through")(v))} />
      <Tool icon={Code} label="Code" keys="E" pressed={fmt.code} disabled={off || fmt.block === "pre"} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("inlineCode")(v))} />
      <Tool icon={Link} label="Link" keys="K" pressed={fmt.link} disabled={off || fmt.block === "pre"} apple={apple} onRun={openLink} />
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={List} label="Bulleted list" keys="Shift+8" pressed={fmt.list === "ul"} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleList(v, "ul"))} />
      <Tool icon={ListOrdered} label="Numbered list" keys="Shift+7" pressed={fmt.list === "ol"} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleList(v, "ol"))} />
      <Tool icon={ListChecks} label="Task list" keys="Shift+9" pressed={fmt.list === "task"} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleList(v, "task"))} />
      <Tool icon={Quote} label="Quote" pressed={fmt.quote} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleQuote(v))} />
      <Tool icon={SquareCode} label="Code block" pressed={fmt.block === "pre"} disabled={off} apple={apple} onRun={() => act((v, L) => L.toggleCodeBlock(v))} />
      <Tool icon={SeparatorHorizontal} label="Horizontal rule" disabled={off} apple={apple} onRun={() => act((v, L) => L.insertRule(v))} />
      <Tool icon={ImagePlus} label="Image" disabled={off} apple={apple} onRun={() => setDialog((d) => ({ open: true, key: d.key + 1 }))} />
      {fmt.table ? (
        <DropdownMenu label="Table" trigger={Table} triggerVariant="ghost" disabled={off} items={tableItems} className="w-52" />
      ) : (
        <Popover
          label="Insert table"
          trigger={Table}
          triggerVariant="ghost"
          disabled={off}
          open={tableOpen}
          onOpenChange={setTableOpen}
          bodyClassName="p-2"
        >
          <TableSizePicker
            onPick={(rows, cols) => {
              setTableOpen(false);
              act((v, L) => L.insertTable(v, rows, cols));
            }}
          />
        </Popover>
      )}
      <DropdownMenu
        label="Math"
        trigger={Sigma}
        triggerVariant="ghost"
        disabled={off}
        items={[
          { label: "Inline math", icon: Sigma, hint: "$x^2$ in a line", onSelect: () => act((v, L) => L.insertMath(v, false)) },
          { label: "Math block", icon: SquareSigma, hint: "$$ on lines of its own", onSelect: () => act((v, L) => L.insertMath(v, true)) },
        ]}
      />
      <DropdownMenu label="More block actions" trigger={Ellipsis} triggerVariant="ghost" disabled={off} items={blockItems}
        onOpenChange={(o) => {
          if (o) menuSource.current = "caret";
        }} className="w-56" />
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={Undo2} label="Undo" keys="Z" disabled={off || !fmt.undo} apple={apple} onRun={() => act((v, L) => L.undoCommand(v))} />
      <Tool icon={Redo2} label="Redo" keys="Shift+Z" disabled={off || !fmt.redo} apple={apple} onRun={() => act((v, L) => L.redoCommand(v))} />
    </div>
  );

  // ------------------------------------------------------------------------------------------
  // The popovers around the text

  const showFloats = editable && mode === "write" && ready;
  const bubbleWanted = showFloats && around.range && (focused || floatFocus === "bubble") && !pointerDown && !link;
  const linkBubbleWanted = showFloats && !!around.link && !around.range && (focused || floatFocus === "link") && !link && around.image == null;
  const imageWanted = showFloats && around.image != null && (focused || floatFocus === "image");
  const tableWanted = showFloats && around.table != null && (focused || floatFocus === "table") && !around.range;

  const selRect = () => {
    const v = view();
    if (!v) return null;
    const s = v.state.selection;
    return selectionRect(v, s.from, s.to);
  };
  const imageEl = () => (around.image != null ? (view()?.nodeDOM(around.image) as HTMLElement | null) : null);
  const tableEl = () => {
    const v = view();
    if (!v || around.table == null) return null;
    const el = v.nodeDOM(around.table) as HTMLElement | null;
    return el?.querySelector("table") ?? el;
  };
  const bubbleIn = useInView(bubbleWanted, selRect, scroller);
  const linkIn = useInView(linkBubbleWanted, linkAnchor, scroller);
  const imageIn = useInView(imageWanted, () => imageEl()?.getBoundingClientRect() ?? null, scroller);
  const tableIn = useInView(tableWanted, () => tableEl()?.getBoundingClientRect() ?? null, scroller);

  const floatFocusProps = (key: string) => ({
    onFocus: () => setFloatFocus(key),
    onBlur: (e: FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFloatFocus((k) => (k === key ? null : k));
    },
  });

  const aria = {
    "aria-label": ariaLabel,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": f["aria-invalid"],
    "aria-required": f.required || undefined,
  };
  const textSize = size === "lg" ? "text-[16px]" : "text-[14px]";
  const column = measure && "mx-auto w-full max-w-[calc(75ch+2.75rem)]";
  const empty = !value.trim();

  return (
    <div
      ref={box}
      data-slot="milkdown-editor"
      data-mode={mode}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative flex min-w-0 flex-col border bg-background text-[14px]",
        f.invalid ? "border-destructive" : "border-input",
        "has-[[data-milkdown-input]:focus-visible]:outline-2 has-[[data-milkdown-input]:focus-visible]:outline-offset-1 has-[[data-milkdown-input]:focus-visible]:outline-ring",
        controlSize(size),
        className,
      )}
      {...rest}
    >
      <div className="sticky top-0 z-[2] flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted p-1">
        {mode === "write" && !readOnly ? (
          tools
        ) : (
          <span className="px-1 text-(length:--ctl-text) text-muted-foreground">
            {mode === "markdown" ? (readOnly ? "Markdown source" : "Markdown: paste or drop pictures here too") : mode === "preview" ? "Preview" : "Read only"}
          </span>
        )}
        <fieldset disabled={disabled} className="ml-auto flex min-w-0">
          <SegmentedControl label="Editor mode" value={mode} options={MODES} onChange={changeMode} />
        </fieldset>
      </div>

      <div
        ref={scroller}
        className={cn("relative flex min-h-40 flex-1 flex-col overflow-auto", disabled && "cursor-not-allowed bg-muted text-muted-foreground", contentClassName)}
        onPointerLeave={() => !handleMenu && setHandle(null)}
      >
        <div
          ref={surface}
          hidden={mode === "markdown" || (mode === "preview" && empty)}
          aria-busy={!ready || undefined}
          className={cn("relative flex flex-1 flex-col py-2.5 pr-3 pl-3 sm:pl-8", column)}
          onPointerDown={(e) => {
            if (view()?.dom.contains(e.target as Node)) setPointerDown(true);
          }}
        >
          <Prose measure={false} className={cn(textSize, SURFACE, "flex flex-1 flex-col")}>
          {!ready && (
            <div aria-hidden inert className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
              {value.trim() ? <Rough markdown={value} /> : <p className="text-muted-foreground">{placeholder ?? " "}</p>}
            </div>
          )}
          <div ref={mount} hidden={!ready} className="flex flex-1 flex-col [&_.milkdown]:flex [&_.milkdown]:flex-1 [&_.milkdown]:flex-col [&_.ProseMirror]:flex-1 [&_.ProseMirror>:first-child]:mt-0 [&_.ProseMirror>:last-child]:mb-0" />
          </Prose>
          {handle && editable && ready && (
            <div data-block-handle="" className="absolute z-[1] max-sm:hidden [@media(pointer:coarse)]:hidden" style={{ top: handle.top, left: handle.left }}>
              <DropdownMenu
                label="Block"
                size="xs"
                open={handleMenu}
                onOpenChange={(o) => {
                  if (o) {
                    menuSource.current = "handle";
                    const v = view();
                    handleBlock.current = v && lib.current ? lib.current.blockFromActive(v.state, handle.at) : null;
                  } else {
                    // The menu gives focus back to the handle, which is about to go: back to the text instead
                    window.setTimeout(() => {
                      const el = document.activeElement;
                      if (!el || el === document.body || el.closest("[data-block-handle]")) view()?.focus();
                    }, 60);
                  }
                  setHandleMenu(o);
                }}
                items={blockItems}
                className="w-52"
                trigger={(p) => (
                  <button
                    {...p}
                    draggable
                    aria-label="Block: drag to move, or press for its menu"
                    title="Drag to move, or click for the block's menu"
                    onDragStart={(e) => {
                      const v = view();
                      const L = lib.current;
                      const b = v && L ? L.blockFromActive(v.state, handle.at) : null;
                      if (v && L && b) L.dragBlock(v, b, e.nativeEvent, handle.at.el);
                    }}
                    onDragEnd={() => {
                      const v = view();
                      if (v) lib.current?.endDrag(v);
                      setHandle(null);
                    }}
                    className="flex size-5 cursor-grab items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:cursor-grabbing aria-expanded:bg-accent"
                  >
                    <Icon icon={GripVertical} />
                  </button>
                )}
              />
            </div>
          )}
        </div>
        {mode === "preview" && empty && <p className="px-3 py-2.5 text-muted-foreground">Nothing to preview yet.</p>}

        {mode === "markdown" && (
          <Textarea
            ref={textarea}
            id={textboxId}
            {...aria}
            value={value}
            onChange={(e) => emit(e.target.value)}
            onKeyDown={onSourceKeyDown}
            onPaste={onSourceFiles}
            onDrop={onSourceFiles}
            readOnly={readOnly}
            disabled={disabled}
            placeholder={placeholder}
            spellCheck
            data-milkdown-input=""
            // Sized by CSS where it can be, and by rows on the server, so it doesn't grow on hydration
            rows={Math.max(3, value.split("\n").length)}
            className={cn(
              "flex-1 resize-none border-0 bg-transparent px-3 py-2.5 font-mono leading-[1.55] field-sizing-content focus-visible:outline-none",
              size === "lg" ? "text-[15px]" : "text-[13px]",
              column,
            )}
          />
        )}
      </div>

      {uploads.length > 0 && (
        <ul aria-label="Picture uploads" className="flex flex-col gap-1 border-t border-border bg-muted px-2 py-1.5 text-[13px]">
          {uploads.map((u) => (
            <li key={u.id} className="ctl-xs flex min-w-0 items-center gap-2">
              {u.error == null ? (
                <>
                  <span className="min-w-0 truncate">Uploading {u.name}</span>
                  <Progress label={`Uploading ${u.name}`} value={u.progress == null ? undefined : Math.round(u.progress * 100)} className="max-w-48 flex-1" />
                  <Button size="xs" variant="ghost" onClick={() => cancelUpload(u.id)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Icon icon={CircleX} className="text-destructive" />
                  <span className="min-w-0 flex-1">
                    Couldn&apos;t upload {u.name}: {u.error}
                  </span>
                  <Button size="xs" variant="ghost" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>
                    Dismiss
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="sr-only">
        {said}
      </div>

      {name != null && <input type="hidden" name={name} value={value} />}

      {slots && <Slots store={slots} editable={editable} />}

      {/* The slash menu: a listbox the text box points into (aria-activedescendant), so typing goes on filtering it */}
      <Floating open={slashOpen} mode="manual" anchor={() => at(selRect())} side="bottom" align="start" className="w-64">
        <div id={slashId} role="listbox" aria-label="Blocks" className="max-h-80 overflow-y-auto py-1" onMouseDown={(e) => e.preventDefault()}>
          {slashItems.map((it, i) => (
            <div
              key={it.label}
              id={`${slashId}-${i}`}
              role="option"
              aria-selected={i === slashActive}
              onPointerMove={() => setSlashIndex(i)}
              onClick={() => chooseSlash(it)}
              className={cn(
                "flex min-h-7 cursor-default items-center gap-2 px-2 text-[13px] [&_svg]:size-4",
                i === slashActive ? "bg-primary text-primary-foreground" : "text-popover-foreground",
              )}
            >
              <Icon icon={it.icon} />
              <span className="flex-1">{it.label}</span>
              {it.hint && <kbd className={cn("font-mono text-[12px]", i === slashActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{it.hint}</kbd>}
            </div>
          ))}
          {!slashItems.length && <p className="px-2 py-1 text-[13px] text-muted-foreground">No blocks called “{around.slash?.query}”</p>}
        </div>
      </Floating>

      {/* The bubble over selected words */}
      <Floating
        open={bubbleWanted && bubbleIn}
        mode="manual"
        anchor={() => at(selRect())}
        side="top"
        align="center"
        role="toolbar"
        aria-label="Format selection"
        className="p-0.5"
        {...floatFocusProps("bubble")}
      >
        <div className="ctl-sm flex items-center gap-0.5" onMouseDown={(e) => e.preventDefault()}>
          <Tool icon={Bold} label="Bold" keys="B" pressed={fmt.bold} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("strong")(v))} />
          <Tool icon={Italic} label="Italic" keys="I" pressed={fmt.italic} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("emphasis")(v))} />
          <Tool icon={Strikethrough} label="Strikethrough" keys="Shift+X" pressed={fmt.strike} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("strike_through")(v))} />
          <Tool icon={Code} label="Code" keys="E" pressed={fmt.code} apple={apple} onRun={() => act((v, L) => L.toggleMarkCommand("inlineCode")(v))} />
          <Tool icon={Sigma} label="Math" apple={apple} onRun={() => act((v, L) => L.insertMath(v, false))} />
          <Separator orientation="vertical" className="mx-0.5" />
          <Tool icon={Link} label="Link" keys="K" pressed={fmt.link} apple={apple} onRun={openLink} />
        </div>
      </Floating>

      {/* The link the caret is in: where it goes, Edit, Remove */}
      <Floating
        open={linkBubbleWanted && linkIn}
        mode="manual"
        anchor={() => at(linkAnchor())}
        side="bottom"
        align="start"
        role="group"
        aria-label="Link"
        className="max-w-80 p-1"
        {...floatFocusProps("link")}
      >
        <div className="ctl-sm flex min-w-0 items-center gap-1" onMouseDown={(e) => e.preventDefault()}>
          <a
            href={around.link?.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!around.link?.href.startsWith("#")) return;
              e.preventDefault();
              followLink(around.link.href);
            }}
            className="min-w-0 truncate px-1 text-[13px] text-link underline">
            {around.link?.href.replace(/^mailto:/, "")}
          </a>
          <IconButton variant="ghost" icon={ExternalLink} label={around.link?.href.startsWith("#") ? "Go to link" : "Open link in a new tab"} onClick={() => around.link && followLink(around.link.href)} />
          <IconButton variant="ghost" icon={Pencil} label="Edit link" onClick={openLink} />
          <IconButton variant="ghost" icon={Unlink} label="Remove link" onClick={() => around.link && act((v, L) => L.removeLink(v, around.link!))} />
        </div>
      </Floating>

      {/* The link form */}
      <Floating
        open={link != null}
        onOpenChange={(open) => {
          if (!open) closeLink();
        }}
        anchor={() => at(linkAnchor())}
        side="bottom"
        align="start"
        role="dialog"
        aria-label="Link"
        data-milkdown-link=""
        className="w-80 p-2.5"
      >
        {link && (
          <form onSubmit={applyLink} className="ctl-sm flex flex-col gap-2">
            <Field label="Address" error={link.error}>
              <Input ref={linkInput} value={link.href} placeholder="https://" inputMode="url" onChange={(e) => setLink({ ...link, href: e.target.value, error: undefined })} />
            </Field>
            {(link.askText || link.range) && (
              <Field label="Text">
                <Input value={link.text} onChange={(e) => setLink({ ...link, text: e.target.value })} />
              </Field>
            )}
            <div className="flex justify-end gap-2">
              {link.range && (
                <Button
                  variant="ghost"
                  icon={Unlink}
                  onClick={() => {
                    const r = link.range!;
                    setLink(null);
                    act((v, L) => L.removeLink(v, r));
                  }}
                >
                  Remove link
                </Button>
              )}
              <Button type="submit" variant="primary">
                {link.range ? "Update" : "Add link"}
              </Button>
            </div>
          </form>
        )}
      </Floating>

      {/* A selected picture: its alt text, Remove */}
      <Floating
        open={imageWanted && imageIn}
        mode="manual"
        anchor={imageEl}
        side="bottom"
        align="start"
        role="group"
        aria-label="Picture"
        className="p-1.5"
        {...floatFocusProps("image")}
      >
        <div className="ctl-sm flex items-center gap-1.5">
          <Input
            key={around.image ?? -1}
            aria-label="Alt text"
            placeholder="Alt text: what the picture shows"
            defaultValue={around.imageAlt}
            onChange={(e) => {
              const v = view();
              if (v && around.image != null) lib.current?.setAttrs(v, around.image, { alt: e.target.value });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                view()?.focus();
              }
            }}
            className="w-64 max-w-[60vw]"
          />
          <IconButton variant="ghost" icon={Trash} label="Remove picture" onClick={() => around.image != null && act((v, L) => L.deleteNodeAt(v, around.image!))} />
        </div>
      </Floating>

      {/* In a table: rows, columns, alignment */}
      <Floating
        open={tableWanted && tableIn}
        mode="manual"
        anchor={() => {
          const el = tableEl();
          const c = scroller.current?.getBoundingClientRect();
          if (!el || !c) return el;
          const r = el.getBoundingClientRect();
          // Sticks to the top of the text while the table's own top has scrolled away
          return at(new DOMRect(r.left, Math.max(r.top, c.top + 34), Math.min(r.width, c.width), 0));
        }}
        side="top"
        align="start"
        role="toolbar"
        aria-label="Table"
        className="p-0.5"
        {...floatFocusProps("table")}
      >
        <div className="ctl-sm flex items-center gap-0.5" onMouseDown={(e) => !(e.target as HTMLElement).closest("[role=menu]") && e.preventDefault()}>
          <DropdownMenu
            trigger="Row"
            chevron
            triggerVariant="ghost"
            items={[
              { label: "Insert above", icon: ArrowUp, onSelect: () => act((v, L) => L.addRow("above")(v)) },
              { label: "Insert below", icon: ArrowDown, onSelect: () => act((v, L) => L.addRow("below")(v)) },
              { type: "separator" },
              { label: "Delete row", icon: Trash, destructive: true, onSelect: () => act((v, L) => L.removeRow(v)) },
            ]}
          />
          <DropdownMenu
            trigger="Column"
            chevron
            triggerVariant="ghost"
            items={[
              { label: "Insert left", icon: TextAlignStart, onSelect: () => act((v, L) => L.addColumn("left")(v)) },
              { label: "Insert right", icon: TextAlignEnd, onSelect: () => act((v, L) => L.addColumn("right")(v)) },
              { type: "separator" },
              { label: "Delete column", icon: Trash, destructive: true, onSelect: () => act((v, L) => L.removeColumn(v)) },
            ]}
          />
          <Separator orientation="vertical" className="mx-0.5" />
          <Tool icon={TextAlignStart} label="Align column left" pressed={around.align === "left"} apple={apple} onRun={() => act((v, L) => L.setColumnAlign(v, "left"))} />
          <Tool icon={TextAlignCenter} label="Centre column" pressed={around.align === "center"} apple={apple} onRun={() => act((v, L) => L.setColumnAlign(v, "center"))} />
          <Tool icon={TextAlignEnd} label="Align column right" pressed={around.align === "right"} apple={apple} onRun={() => act((v, L) => L.setColumnAlign(v, "right"))} />
          <Separator orientation="vertical" className="mx-0.5" />
          <Tool icon={Trash} label="Delete table" apple={apple} onRun={() => act((v, L) => L.removeTable(v))} />
        </div>
      </Floating>

      <ImageDialog
        key={dialog.key}
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onInsert={(pick) => {
          setDialog((d) => ({ ...d, open: false }));
          // After the dialog has closed and given focus back: the page behind a modal is inert
          setTimeout(() => (pick.file ? startUpload(pick.file, pick.alt) : placeImage(pick.url, pick.alt)), 0);
        }}
      />
    </div>
  );

  // ------------------------------------------------------------------------------------------
  // The Markdown box

  function onSourceKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || readOnly || disabled) return;
    const t = e.currentTarget;
    const k = e.key.toLowerCase();
    const wrap = (a: string, b: string) => {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value: v } = t;
      const sel = v.slice(s, en);
      if (!document.execCommand("insertText", false, a + sel + b)) {
        t.setRangeText(a + sel + b, s, en, "end");
        emit(t.value);
      }
      t.setSelectionRange(s + a.length, s + a.length + sel.length);
    };
    if (!e.shiftKey && k === "b") wrap("**", "**");
    else if (!e.shiftKey && k === "i") wrap("*", "*");
    else if (!e.shiftKey && k === "e") wrap("`", "`");
    else if (e.shiftKey && e.code === "KeyX") wrap("~~", "~~");
    else if (!e.shiftKey && k === "k") {
      const { selectionStart: s, selectionEnd: en, value: v } = t;
      const text = v.slice(s, en) || "link text";
      e.preventDefault();
      if (!document.execCommand("insertText", false, `[${text}](https://)`)) {
        t.setRangeText(`[${text}](https://)`, s, en, "end");
        emit(t.value);
      }
      const at = s + text.length + 3;
      t.setSelectionRange(at, at + 8);
    }
  }

  function onSourceFiles(e: ClipboardEvent<HTMLTextAreaElement> | DragEvent<HTMLTextAreaElement>) {
    const data = "clipboardData" in e ? e.clipboardData : e.dataTransfer;
    const files = [...data.files].filter(isImageFile);
    if (!files.length || readOnly || disabled) return;
    e.preventDefault();
    files.forEach((file) => startUpload(file));
  }
}

type ImagePick = { file: File; url?: undefined; alt: string } | { file?: undefined; url: string; alt: string };

/** A picture from a file or from an address, with its alt text */
function ImageDialog({ open, onClose, onInsert }: { open: boolean; onClose: (reason: CloseReason) => void; onInsert: (pick: ImagePick) => void }) {
  const formId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string>();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (file) return onInsert({ file, alt: alt.trim() });
    const href = normalizeHref(url);
    if (!href) return setError("Choose a file, or give the picture's address.");
    if (!safeHref(href, true)) return setError("Use a web address that starts with https://, or a path on this site.");
    onInsert({ url: href, alt: alt.trim() });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Insert picture"
      size="sm"
      footer={
        <>
          <Button onClick={() => onClose("close-button")}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary">
            Insert
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-3">
        <Field label="From your computer">
          <FileField
            accept="image/*"
            onItemChange={(item) => {
              setFile(item?.file ?? null);
              setError(undefined);
              if (item?.file && !alt) setAlt(altFromName(item.file.name));
            }}
          />
        </Field>
        <Field label="Or from a web address" error={error}>
          <Input
            value={url}
            placeholder="https://"
            inputMode="url"
            disabled={!!file}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(undefined);
            }}
          />
        </Field>
        <Field label="Alt text" hint="What the picture shows, for people who can't see it. Leave it empty if it is only decoration.">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}
