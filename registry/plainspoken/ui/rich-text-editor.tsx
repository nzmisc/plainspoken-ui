"use client";

import {
  useEffect,
  useEffectEvent,
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
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  Bold,
  CircleX,
  Code,
  ImagePlus,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Redo2,
  SeparatorHorizontal,
  SquareCode,
  Strikethrough,
  Trash,
  Undo2,
  Unlink,
  type Glyph,
} from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import {
  UPLOADING_PREFIX,
  htmlToMarkdown,
  imageMarkdown,
  markdownToHtml,
  markdownUrl,
  parseMarkdown,
  renderHtml,
  renderInlineHtml,
  safeUrl,
} from "@/registry/plainspoken/lib/markdown";
import {
  blocksOf,
  caretAfter,
  closestIn,
  emptyParagraph,
  indentItems,
  insertImage,
  insertRule,
  isEmptyBlock,
  isEmptyDoc,
  leafOf,
  listKind,
  normalize,
  outdentItem,
  patchArea,
  rangeIn,
  readFormats,
  rebaseSnapshot,
  restoreSnapshot,
  setBlockType,
  setCaret,
  setTask,
  stepOut,
  takeSnapshot,
  textAfter,
  textBefore,
  toggleCodeBlock,
  toggleInlineCode,
  toggleList,
  toggleQuote,
  withSelection,
  type BlockKind,
  type ListKind,
  type Snapshot,
} from "@/registry/plainspoken/lib/rich-text";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Dialog, type CloseReason } from "@/registry/plainspoken/ui/dialog";
import { Field, useField, useFieldProps } from "@/registry/plainspoken/ui/field";
import { FileField } from "@/registry/plainspoken/ui/file-upload";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { Prose } from "@/registry/plainspoken/ui/prose";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { Separator } from "@/registry/plainspoken/ui/separator";
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
export interface RichTextEditorHandle {
  focus(): void;
  /** Uploads a picture (through onUploadImage) and puts it at the caret */
  insertImage(file: File, alt?: string): void;
  /** Puts a picture that is already online at the caret */
  insertImageUrl(url: string, alt?: string): void;
  /**
   * Applies a change made elsewhere (another person, the server): the text becomes `markdown`.
   * Only the blocks whose Markdown differs are redrawn; the selection stays where it was, or on
   * the same character offset when its block changed. It isn't an undo step, and your own undo
   * steps are rebased onto it (one that touched a block it changed is dropped), so undo never
   * takes it back. onChange isn't called. A controlled editor does the same by itself when
   * `value` changes to something it didn't send through onChange.
   */
  applyRemote(markdown: string): void;
}

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "children" | "placeholder"> {
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
  editorRef?: Ref<RichTextEditorHandle>;
  /** Classes for the scrolling text area: a min-h or max-h. Default min-h-40. */
  contentClassName?: string;
  /** Cap the line length at about 75 characters, centred: for a document editor that fills a page */
  measure?: boolean;
}

interface Formats {
  block: BlockKind;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  link: boolean;
  list: ListKind | null;
  quote: boolean;
  image: boolean;
  imageAlt: string;
  /** The code block's language, when the caret is in one */
  lang: string | null;
}

const NO_FORMATS: Formats = { block: "p", bold: false, italic: false, strike: false, code: false, link: false, list: null, quote: false, image: false, imageAlt: "", lang: null };
const sameFormats = (a: Formats, b: Formats) => (Object.keys(a) as (keyof Formats)[]).every((k) => a[k] === b[k]);

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
  /** Editing a link that is there already */
  existing: boolean;
  /** Nothing selected: the link needs words of its own */
  askText: boolean;
  error?: string;
}

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

/** For grouping keystrokes in the history; only read in events */
const clock = () => Date.now();

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

const isImageFile = (f: File) => f.type.startsWith("image/");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Where a drop landed, as a caret */
function caretAtPoint(x: number, y: number): Range | null {
  const d = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
  const pos = d.caretPositionFromPoint?.(x, y);
  if (pos) {
    const r = document.createRange();
    r.setStart(pos.offsetNode, pos.offset);
    return r;
  }
  return document.caretRangeFromPoint?.(x, y) ?? null;
}

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

/**
 * A rich text editor whose text is Markdown, in three modes: Write (formatted, editable as it
 * will look), Markdown (the source, in a monospace text box) and Preview (rendered with Prose).
 * Every mode reads and writes the same Markdown string, so switching loses nothing; Write mode
 * rewrites the source tidily (one way of writing each thing) only once you change something in it.
 *
 * Write mode is a contenteditable area with role="textbox", and a toolbar per the ARIA toolbar
 * pattern: one Tab stop, ←/→, Home and End between its controls. Its state follows the caret.
 * Keys (⌘ on Apple devices, Ctrl elsewhere): ⌘B bold, ⌘I italic, ⇧⌘X strikethrough, ⌘E code,
 * ⌘K link, ⇧⌘7 numbered, ⇧⌘8 bulleted, ⇧⌘9 task list, ⌥⌘0–3 paragraph and headings, ⌘Z undo,
 * ⇧⌘Z or ⌘Y redo, ⌘Enter ticks a task. Tab and ⇧Tab indent list items (press Esc first to Tab out
 * of the editor instead). Markdown typed at a line's start turns into its block: "# " to "### ",
 * "- ", "1. ", "[ ] ", "> ", and ``` or --- then Enter; `code` between backticks turns into code.
 *
 * Pictures: the toolbar's image button (a file, or an address), pasting, or dropping. With
 * onUploadImage each one shows faded, with progress under the text, until its URL comes back;
 * meanwhile the Markdown says `![alt](#uploading-…)`. Click a picture to write its alt text or
 * remove it (Tab gets there from the keyboard).
 *
 * Paste keeps only what Markdown can say: pasted HTML goes through the same reader and writer, so
 * styles, classes and scripts are gone; plain text is read as Markdown. Raw HTML in the source is
 * shown as text, and only http(s), mailto, blob, data:image and relative URLs are kept (see
 * lib/markdown). Inside a Field it takes the label, hint and error like Input does.
 */
export function RichTextEditor({
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
}: RichTextEditorProps) {
  const f = useFieldProps({ id, invalid, required });
  const field = useField();
  const autoId = useId();
  const textboxId = f.id ?? `${autoId}-text`;
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
  const describedBy = [f["aria-describedby"], ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  const apple = useApple();

  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = valueProp ?? ownValue;
  const [ownMode, setOwnMode] = useState<EditorMode>(defaultMode);
  const mode = modeProp ?? ownMode;
  const editable = !disabled && !readOnly;

  // The editable area is drawn once from the first value (on the server too); after that the
  // editor owns its DOM, and React never touches it.
  const [initial] = useState(() => ({ html: markdownToHtml(value, { editable: true }), empty: !value.trim() }));

  const [fmt, setFmt] = useState<Formats>(NO_FORMATS);
  const [hist, setHist] = useState({ undo: false, redo: false });
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [link, setLink] = useState<LinkDraft | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; key: number }>({ open: false, key: 0 });
  const [imageKey, setImageKey] = useState(0);
  const [said, setSaid] = useState("");

  const box = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const altInput = useRef<HTMLInputElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  /** The newest Markdown, ahead of the next render */
  const latest = useRef(value);
  /** The Markdown the editable area shows */
  const synced = useRef(value);
  /** The last Markdown this editor sent out (a value that differs came from elsewhere) */
  const emitted = useRef(value);
  /** The Markdown box's selection and text, kept to carry the caret through changes from elsewhere */
  const sourceSel = useRef<{ start: number; end: number; text: string } | null>(null);
  const history = useRef({ entries: [] as Snapshot[], index: -1, group: null as string | null, time: 0, start: 0 });
  const savedRange = useRef<Range | null>(null);
  const selectedImg = useRef<HTMLImageElement | null>(null);
  const selectedPre = useRef<HTMLElement | null>(null);
  const linkTarget = useRef<HTMLAnchorElement | null>(null);
  const linkAnchor = useRef<{ getBoundingClientRect(): DOMRect } | null>(null);
  const busy = useRef(false);
  const composing = useRef(false);
  const internalDrag = useRef(false);
  const escaped = useRef(false);
  const lastTool = useRef<HTMLElement | null>(null);
  const pointerPick = useRef(false);
  const controllers = useRef(new Map<string, AbortController>());
  const locals = useRef(new Map<string, string>());
  const finals = useRef(new Map<string, string>());

  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);

  const say = (text: string) => setSaid((s) => (s === text ? `${text} ` : text));

  const emit = (md: string) => {
    if (md === latest.current) return;
    latest.current = md;
    emitted.current = md;
    setOwnValue(md);
    onChange?.(md);
  };

  const shownSrc = (src: string) => (src.startsWith(UPLOADING_PREFIX) ? locals.current.get(src.slice(UPLOADING_PREFIX.length)) : undefined);

  // ------------------------------------------------------------------------------------------
  // History and committing changes

  const setHistFlags = () => {
    const h = history.current;
    const undo = h.index > 0;
    const redo = h.index < h.entries.length - 1;
    setHist((p) => (p.undo === undo && p.redo === redo ? p : { undo, redo }));
  };

  /** A history entry for the area's state now. Typing within a second of the last keystroke joins its entry. */
  const record = (root: HTMLElement, group: string | null) => {
    const h = history.current;
    const snap = takeSnapshot(root);
    const top = h.entries[h.index];
    const now = clock();
    if (top?.html === snap.html) {
      top.selection = snap.selection;
      return;
    }
    h.entries.length = h.index + 1;
    if (top && group && group === h.group && now - h.time < 1000 && now - h.start < 5000) h.entries[h.index] = snap;
    else {
      h.entries.push(snap);
      if (h.entries.length > 300) h.entries.shift();
      h.index = h.entries.length - 1;
      h.start = now;
    }
    h.group = group;
    h.time = now;
    setHistFlags();
  };

  const refreshEmpty = (root: HTMLElement) => root.toggleAttribute("data-empty", isEmptyDoc(root));

  /** Finished uploads in HTML that undo brought back */
  const fixUploads = (root: HTMLElement) => {
    for (const img of root.querySelectorAll<HTMLImageElement>("img[data-uploading]")) {
      const done = finals.current.get((img.getAttribute("data-src") ?? "").slice(UPLOADING_PREFIX.length));
      if (done == null) continue;
      img.setAttribute("src", done);
      img.removeAttribute("data-src");
      img.removeAttribute("data-uploading");
    }
  };

  /** The area's Markdown out, without a history entry (an upload finishing) */
  const publish = (root: HTMLElement) => {
    const md = htmlToMarkdown(root);
    synced.current = md;
    emit(md);
  };

  const readSelection = () => {
    const root = area.current;
    const r = rangeIn(root);
    if (!root || !r) return;
    savedRange.current = r.cloneRange();
    const s = readFormats(root, r);
    const typing = (cmd: string) => {
      try {
        return r.collapsed && document.queryCommandState(cmd);
      } catch {
        return false;
      }
    };
    const img = s.image;
    if (img !== selectedImg.current) {
      selectedImg.current?.removeAttribute("data-selected");
      img?.setAttribute("data-selected", "");
      selectedImg.current = img;
      if (img) setImageKey((k) => k + 1);
    }
    selectedPre.current = s.pre;
    linkTarget.current = s.link;
    const heading = s.block !== "p" && s.block !== "pre";
    const next: Formats = {
      block: s.block,
      bold: s.bold || (!heading && typing("bold")),
      italic: s.italic || typing("italic"),
      strike: s.strike || typing("strikeThrough"),
      code: s.code,
      link: !!s.link,
      list: s.list,
      quote: s.quote,
      image: !!img,
      imageAlt: img?.getAttribute("alt") ?? "",
      lang: s.pre ? (s.pre.getAttribute("data-lang") ?? "") : null,
    };
    setFmt((p) => (sameFormats(p, next) ? p : next));
  };

  /** After an edit: back to the Markdown subset, into history, and out as Markdown */
  const commit = (group: string | null = null) => {
    const root = area.current;
    if (!root) return;
    withSelection(root, () => normalize(root));
    refreshEmpty(root);
    record(root, group);
    publish(root);
    readSelection();
  };

  const restore = (snap: Snapshot, fallback?: Snapshot["selection"]) => {
    const root = area.current;
    if (!root) return;
    restoreSnapshot(root, snap, fallback);
    fixUploads(root);
    refreshEmpty(root);
    selectedImg.current = null;
    history.current.group = null;
    publish(root);
    readSelection();
    setHistFlags();
  };
  const undo = () => {
    const h = history.current;
    if (h.index <= 0) return;
    h.index--;
    restore(h.entries[h.index], h.entries[h.index + 1].selection);
  };
  const redo = () => {
    const h = history.current;
    if (h.index >= h.entries.length - 1) return;
    h.index++;
    restore(h.entries[h.index], h.entries[h.index - 1].selection);
  };

  /** Focus in the area, with the selection it had before focus went to the toolbar or a popup */
  const focusArea = (): Range | null => {
    const root = area.current;
    if (!root) return null;
    const had = rangeIn(root);
    if (document.activeElement !== root) root.focus({ preventScroll: true });
    const saved = savedRange.current;
    if (!had && saved && root.contains(saved.startContainer) && root.contains(saved.endContainer)) {
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(saved);
    }
    if (!rangeIn(root)) setCaret(root.lastElementChild ?? root, root.lastElementChild?.childNodes.length ?? 0);
    return rangeIn(root);
  };

  /**
   * Runs a change on the area as one step: focus and selection back first, the selection kept
   * through it (see withSelection), then committed. Focus goes back to the toolbar control that
   * asked, so keyboard users can carry on there.
   */
  const run = (change: (root: HTMLElement, range: Range) => boolean | "caret", group: string | null = null) => {
    const root = area.current;
    if (!root || !editable) return;
    const back = toolbar.current?.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    const range = focusArea();
    if (!range) return;
    busy.current = true;
    try {
      withSelection(root, () => change(root, range));
    } finally {
      busy.current = false;
    }
    commit(group);
    back?.focus({ preventScroll: true });
  };

  // ------------------------------------------------------------------------------------------
  // Commands

  /** Bold, italic and strikethrough by the browser, which splits marks across text well */
  const format = (cmd: "bold" | "italic" | "strikeThrough") =>
    run((root) => {
      // Headings and table headers are bold already, and the browser would "unbold" them with a
      // styled span: they are drawn plain while it works, so it adds <b> instead
      root.setAttribute("data-plain", "");
      try {
        document.execCommand("styleWithCSS", false, "false");
        document.execCommand(cmd);
      } finally {
        root.removeAttribute("data-plain");
      }
      return "caret";
    });

  const setBlock = (kind: BlockKind) => run((root, range) => (kind === "pre" ? (fmt.block === "pre" ? false : toggleCodeBlock(root, range)) : setBlockType(root, range, kind)));
  const list = (kind: ListKind) => run((root, range) => toggleList(root, range, kind));

  const openLink = () => {
    const root = area.current;
    if (!root || !editable) return;
    const r = rangeIn(root) ?? savedRange.current;
    if (!r) return;
    savedRange.current = r.cloneRange();
    const a = closestIn(r.startContainer, /^A$/, root) as HTMLAnchorElement | null;
    linkTarget.current = a;
    const rect = (a ?? r).getBoundingClientRect();
    const leaf = leafOf(r.startContainer, root);
    linkAnchor.current = { getBoundingClientRect: () => (rect.width || rect.height || !leaf ? rect : leaf.getBoundingClientRect()) };
    setLink({ href: a?.getAttribute("href") ?? "", text: a ? (a.textContent ?? "") : r.toString(), existing: !!a, askText: !a && r.collapsed });
  };

  const closeLink = () => {
    setLink(null);
    const active = document.activeElement;
    if (!active || active === document.body || active.closest("[data-rte-link]")) focusArea();
  };

  const applyLink = (e: FormEvent) => {
    e.preventDefault();
    if (!link) return;
    const href = normalizeHref(link.href);
    if (!href || safeUrl(href) == null) {
      setLink({ ...link, error: "Use a web address (https://…), an email address, or a link within the site." });
      return;
    }
    const text = link.text.trim();
    setLink(null);
    run((root, range) => {
      const a = linkTarget.current;
      if (a && root.contains(a)) {
        a.setAttribute("href", href);
        if (text && text !== a.textContent) a.textContent = text;
        return stepOut(a);
      }
      if (range.collapsed) {
        const el = document.createElement("a");
        el.setAttribute("href", href);
        el.textContent = text || href;
        range.insertNode(el);
        return stepOut(el);
      }
      document.execCommand("createLink", false, href);
      return "caret";
    });
  };

  const removeLink = () => {
    setLink(null);
    run(() => {
      const a = linkTarget.current;
      if (!a?.isConnected) return false;
      a.replaceWith(...a.childNodes);
      return true;
    });
  };

  /** Characters at the caret, as one step of typing (code blocks: line ends, indents) */
  const typeText = (text: string) =>
    run((_, r) => {
      r.deleteContents();
      const n = r.startContainer;
      if (n.nodeType === 3) {
        (n as Text).insertData(r.startOffset, text);
        setCaret(n, r.startOffset + text.length);
      } else {
        const t = document.createTextNode(text);
        r.insertNode(t);
        setCaret(t, text.length);
      }
      return "caret";
    }, "typing");

  const setLang = (lang: string) => {
    const pre = selectedPre.current;
    const root = area.current;
    if (!pre || !root?.contains(pre)) return;
    const l = lang.trim().replace(/\s+/g, "-");
    if (l) pre.setAttribute("data-lang", l);
    else pre.removeAttribute("data-lang");
    setFmt((p) => ({ ...p, lang }));
    record(root, "lang");
    publish(root);
  };

  // ------------------------------------------------------------------------------------------
  // Pictures

  /** A picture's Markdown at the text box's caret, on a line of its own */
  const insertIntoSource = (md: string) => {
    const t = textarea.current;
    if (!t) {
      emit(latest.current ? `${latest.current}\n\n${md}` : md);
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
    if (!document.execCommand("insertText", false, pre + md + post)) {
      t.setRangeText(pre + md + post, s, e, "end");
      emit(t.value);
    }
  };

  /** A picture into the text: `src` is what the Markdown says, `shown` what to draw meanwhile */
  const placeImage = (src: string, alt: string, shown?: string) => {
    if (mode !== "write") {
      insertIntoSource(imageMarkdown(alt, src));
      return;
    }
    run((root, range) => {
      const img = document.createElement("img");
      img.setAttribute("src", shown ?? src);
      img.setAttribute("alt", alt);
      if (shown) {
        img.setAttribute("data-src", src);
        img.setAttribute("data-uploading", "");
      }
      return insertImage(root, range, img);
    }, null);
  };

  const finishUpload = (id: string, url: string, name: string) => {
    controllers.current.delete(id);
    finals.current.set(id, url);
    setUploads((u) => u.filter((x) => x.id !== id));
    const placeholder = `](${UPLOADING_PREFIX}${id})`;
    const md = latest.current;
    const root = area.current;
    const inSync = synced.current === md;
    if (root && inSync) {
      for (const img of root.querySelectorAll<HTMLImageElement>(`img[data-src="${UPLOADING_PREFIX}${id}"]`)) {
        img.setAttribute("src", url);
        img.removeAttribute("data-src");
        img.removeAttribute("data-uploading");
      }
      const top = history.current.entries[history.current.index];
      if (top) top.html = takeSnapshot(root).html;
      publish(root);
    } else if (md.includes(placeholder)) emit(md.split(placeholder).join(`](${markdownUrl(url)})`));
    say(`${name} uploaded`);
  };

  const failUpload = (id: string, name: string, error: string | null) => {
    controllers.current.delete(id);
    setUploads((u) => (error ? u.map((x) => (x.id === id ? { ...x, error, progress: null } : x)) : u.filter((x) => x.id !== id)));
    const root = area.current;
    const md = latest.current;
    if (root && synced.current === md) {
      root.querySelectorAll(`img[data-src="${UPLOADING_PREFIX}${id}"]`).forEach((img) => img.remove());
      withSelection(root, () => normalize(root));
      publish(root);
    } else emit(md.replace(new RegExp(`(\\n\\n)?!\\[(?:[^\\]\\\\]|\\\\.)*\\]\\(${escapeRe(UPLOADING_PREFIX + id)}\\)`, "g"), ""));
    say(error ? `Couldn't upload ${name}: ${error}` : `Upload of ${name} canceled`);
  };

  const startUpload = (file: File, alt = altFromName(file.name)) => {
    if (!isImageFile(file)) return;
    const local = URL.createObjectURL(file);
    if (!onUploadImage) {
      placeImage(local, alt);
      return;
    }
    const id = uploadId();
    locals.current.set(id, local);
    const controller = new AbortController();
    controllers.current.set(id, controller);
    setUploads((u) => [...u, { id, name: file.name, progress: null, local }]);
    placeImage(UPLOADING_PREFIX + id, alt, local);
    say(`Uploading ${file.name}`);
    onUploadImage(file, {
      signal: controller.signal,
      onProgress: (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: Math.max(x.progress ?? 0, Math.min(1, p)) } : x))),
    }).then(
      (url) => {
        if (!controller.signal.aborted) finishUpload(id, url, file.name);
      },
      (err: unknown) => failUpload(id, file.name, controller.signal.aborted ? null : err instanceof Error && err.message ? err.message : "the upload failed"),
    );
  };

  const cancelUpload = (id: string) => {
    const c = controllers.current.get(id);
    const u = uploads.find((x) => x.id === id);
    c?.abort();
    if (u) failUpload(id, u.name, null);
  };

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((c) => c.abort());
  }, []);

  const setAlt = (alt: string) => {
    const img = selectedImg.current;
    const root = area.current;
    if (!img || !root?.contains(img)) return;
    img.setAttribute("alt", alt);
    record(root, "alt");
    publish(root);
  };

  const removeImage = () => {
    const img = selectedImg.current;
    if (!img) return;
    run(() => {
      const parent = img.parentNode;
      if (!parent) return false;
      const at = Array.prototype.indexOf.call(parent.childNodes, img);
      img.remove();
      selectedImg.current = null;
      setCaret(parent, at);
      return "caret";
    });
  };

  /** From the alt text box back to the picture */
  const backToImage = () => {
    focusArea();
  };

  // ------------------------------------------------------------------------------------------
  // Typing shortcuts

  /** A new item made by Enter in a task list is a task too */
  const newTaskItem = () => {
    const root = area.current;
    const r = rangeIn(root);
    const li = r && root ? closestIn(r.startContainer, /^LI$/, root) : null;
    const prev = li?.previousElementSibling as HTMLElement | null;
    if (li && prev && listKind(prev) === "task" && listKind(li) !== "task") setTask(li, true);
  };

  /** What was typed before the caret, taken out */
  const strip = (leaf: HTMLElement, r: Range) => {
    const rr = document.createRange();
    rr.setStart(leaf, 0);
    rr.setEnd(r.startContainer, r.startOffset);
    rr.deleteContents();
    leaf.querySelector(":scope > [data-task]")?.remove();
    if (isEmptyBlock(leaf) && !leaf.querySelector("br")) leaf.append(document.createElement("br"));
  };

  const blockShortcut = () => {
    const root = area.current;
    const r = rangeIn(root);
    if (!root || !r?.collapsed) return;
    const leaf = leafOf(r.startContainer, root);
    if (!leaf) return;
    const b = textBefore(leaf, r).replace(/\u00a0/g, " ");
    let op: ((root: HTMLElement, range: Range) => boolean | "caret") | null = null;
    let m: RegExpExecArray | null;
    if (leaf.tagName === "LI") {
      if ((m = /^\[([ xX]?)\] $/.exec(b)) && listKind(leaf) === "ul") {
        const done = /x/i.test(m[1]);
        op = () => (setTask(leaf, true, done), true);
      }
    } else if (leaf.tagName === "P" && !leaf.closest("li,td,th")) {
      if ((m = /^(#{1,6}) $/.exec(b))) {
        const kind = `h${m[1].length}` as Exclude<BlockKind, "pre">;
        op = (root, range) => setBlockType(root, range, kind);
      } else if (/^[-*+] $/.test(b)) op = (root, range) => toggleList(root, range, "ul");
      else if ((m = /^(\d{1,9})[.)] $/.exec(b))) {
        const start = parseInt(m[1], 10);
        op = (root, range) => {
          toggleList(root, range, "ol");
          const ol = closestIn(range.startContainer, /^OL$/, root);
          if (ol && start !== 1) ol.setAttribute("start", String(start));
          return true;
        };
      } else if ((m = /^(?:[-*+] )?\[([ xX]?)\] $/.exec(b))) {
        const done = /x/i.test(m[1]);
        op = (root, range) => {
          toggleList(root, range, "task");
          const li = closestIn(range.startContainer, /^LI$/, root);
          if (li && done) {
            li.querySelector("input")?.setAttribute("checked", "");
            li.setAttribute("data-checked", "true");
          }
          return true;
        };
      } else if (b === "> ") op = (root, range) => toggleQuote(root, range);
    }
    if (!op) return;
    // The typed marker goes first, outside the change, so the caret kept through it is the one after it
    strip(leaf, r);
    run(op, "shortcut");
  };

  const codeShortcut = () => {
    const root = area.current;
    const r = rangeIn(root);
    if (!root || !r?.collapsed || r.startContainer.nodeType !== 3 || closestIn(r.startContainer, /^(CODE|PRE)$/, root)) return;
    const t = r.startContainer as Text;
    const end = r.startOffset;
    const m = /`([^`​]+)`$/.exec(t.data.slice(0, end));
    if (!m) return;
    run(() => {
      const rr = document.createRange();
      rr.setStart(t, end - m[0].length);
      rr.setEnd(t, end);
      rr.deleteContents();
      const c = document.createElement("code");
      c.textContent = m[1];
      rr.insertNode(c);
      return stepOut(c);
    }, "shortcut");
  };

  // ------------------------------------------------------------------------------------------
  // Keeping the area in step with the Markdown

  /** A block's Markdown, to tell which blocks a change touched */
  const blockKey = (el: Element) => htmlToMarkdown({ nodeType: 1, nodeName: "DIV", nodeValue: null, childNodes: [el] });

  /** The area redrawn as `md`, only where it differs. Local (from the Markdown box) is an undo step; remote isn't. */
  const redraw = (md: string, local: boolean) => {
    const root = area.current;
    if (!root) return;
    const base = blocksOf(root);
    const patch = patchArea(root, markdownToHtml(md, { editable: true, imageSrc: shownSrc }), blockKey);
    synced.current = md;
    if (selectedImg.current && !root.contains(selectedImg.current)) selectedImg.current = null;
    withSelection(root, () => normalize(root));
    refreshEmpty(root);
    if (local) record(root, null);
    else if (patch) {
      // Your steps, rebased onto the change; one that conflicts with it is dropped with all before (or after) it
      const h = history.current;
      const kept: Snapshot[] = [];
      let index = -1;
      for (let i = 0; i < h.entries.length; i++) {
        if (i === h.index) {
          index = kept.length;
          kept.push(takeSnapshot(root));
          continue;
        }
        const r = rebaseSnapshot(h.entries[i], base, patch);
        if (r) kept.push(r);
        else if (i < h.index) kept.length = 0;
        else break;
      }
      h.entries = kept;
      h.index = index;
      h.group = null;
      setHistFlags();
    } else {
      const top = history.current.entries[history.current.index];
      if (top) Object.assign(top, takeSnapshot(root));
    }
    readSelection();
  };

  const applyRemote = (md: string) => {
    if (md === latest.current) return;
    latest.current = md;
    setOwnValue(md);
    if (mode === "write") redraw(md, false);
  };

  const syncArea = useEffectEvent(() => {
    if (!area.current || mode !== "write" || synced.current === value) return;
    redraw(value, value === emitted.current);
  });
  useLayoutEffect(() => syncArea(), [mode, value]);

  const onSelectionChange = useEffectEvent(() => {
    if (mode === "write") readSelection();
  });
  const onBeforeInput = useEffectEvent((e: InputEvent) => {
    if (!editable) {
      e.preventDefault();
      return;
    }
    switch (e.inputType) {
      case "historyUndo":
        e.preventDefault();
        undo();
        break;
      case "historyRedo":
        e.preventDefault();
        redo();
        break;
      default:
        // Markdown has no underline, colour, font or alignment
        if (/^format(?!Bold|Italic|StrikeThrough)/.test(e.inputType)) e.preventDefault();
    }
  });
  const onInput = useEffectEvent((e: InputEvent) => {
    if (busy.current || composing.current || e.isComposing) return;
    const t = e.inputType;
    if (t === "insertParagraph") newTaskItem();
    commit(t === "insertText" || t === "insertReplacementText" ? "typing" : t.startsWith("delete") ? "deleting" : null);
    if (t === "insertText" && e.data === " ") blockShortcut();
    if (t === "insertText" && e.data === "`") codeShortcut();
  });
  useEffect(() => {
    const root = area.current;
    if (!root) return;
    const h = history.current;
    if (!h.entries.length) {
      h.entries = [takeSnapshot(root)];
      h.index = 0;
    }
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // Not every browser knows it; Enter makes paragraphs anyway, and divs are made paragraphs
    }
    const sel = () => onSelectionChange();
    const before = (e: Event) => onBeforeInput(e as InputEvent);
    const input = (e: Event) => onInput(e as InputEvent);
    document.addEventListener("selectionchange", sel);
    root.addEventListener("beforeinput", before);
    root.addEventListener("input", input);
    return () => {
      document.removeEventListener("selectionchange", sel);
      root.removeEventListener("beforeinput", before);
      root.removeEventListener("input", input);
    };
  }, []);

  // A <label for> can't focus a contenteditable by itself
  useEffect(() => {
    if (mode !== "write") return;
    const label = document.querySelector(`label[for="${CSS.escape(textboxId)}"]`);
    const onClick = () => area.current?.focus();
    label?.addEventListener("click", onClick);
    return () => label?.removeEventListener("click", onClick);
  }, [mode, textboxId]);

  // Text changed from elsewhere while the Markdown box has focus: the caret stays on the same characters
  useLayoutEffect(() => {
    const t = textarea.current;
    const s = sourceSel.current;
    if (!t || mode !== "markdown" || !s || s.text === value || document.activeElement !== t) return;
    let pre = 0;
    while (pre < s.text.length && pre < value.length && s.text[pre] === value[pre]) pre++;
    let suf = 0;
    while (suf < s.text.length - pre && suf < value.length - pre && s.text[s.text.length - 1 - suf] === value[value.length - 1 - suf]) suf++;
    const map = (i: number) => (i <= pre ? i : i >= s.text.length - suf ? i + value.length - s.text.length : value.length - suf);
    t.setSelectionRange(map(s.start), map(s.end));
    sourceSel.current = { start: t.selectionStart, end: t.selectionEnd, text: value };
  }, [mode, value]);

  // The Markdown box grows with its text (field-sizing isn't everywhere yet)
  useLayoutEffect(() => {
    const t = textarea.current;
    if (!t || mode !== "markdown") return;
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

  useImperativeHandle(
    editorRef,
    () => ({
      focus: () => (mode === "markdown" ? textarea.current?.focus() : area.current?.focus()),
      insertImage: (file: File, alt?: string) => startUpload(file, alt),
      insertImageUrl: (url: string, alt = "") => placeImage(url, alt),
      applyRemote: (markdown: string) => applyRemote(markdown),
    }),
  );

  // ------------------------------------------------------------------------------------------
  // Events in the area

  const toggleTask = () => {
    run((root, range) => {
      const li = closestIn(range.startContainer, /^LI$/, root);
      const input = li?.querySelector<HTMLInputElement>(":scope > [data-task] input");
      if (!li || !input) return false;
      const on = !input.hasAttribute("checked");
      input.toggleAttribute("checked", on);
      input.checked = on;
      li.setAttribute("data-checked", String(on));
      return true;
    }, "task");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!editable) return;
    const root = e.currentTarget;
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();
    if (e.key !== "Tab") escaped.current = e.key === "Escape";
    const act = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    if (mod && !e.altKey) {
      if (k === "z") return act(e.shiftKey ? redo : undo);
      if (k === "y" && !e.shiftKey) return act(redo);
      if (!e.shiftKey) {
        if (k === "b") return act(() => format("bold"));
        if (k === "i") return act(() => format("italic"));
        if (k === "u") return act(() => {});
        if (k === "k") return act(openLink);
        if (k === "e") return act(() => run(toggleInlineCode));
        if (e.key === "Enter") return act(toggleTask);
      } else {
        if (e.code === "KeyX") return act(() => format("strikeThrough"));
        if (e.code === "Digit7") return act(() => list("ol"));
        if (e.code === "Digit8") return act(() => list("ul"));
        if (e.code === "Digit9") return act(() => list("task"));
      }
    }
    if (mod && e.altKey && !e.getModifierState("AltGraph") && /^Digit[0-3]$/.test(e.code))
      return act(() => setBlock(e.code === "Digit0" ? "p" : (`h${e.code.slice(5)}` as BlockKind)));
    if (mod || e.altKey) return;
    const range = rangeIn(root);
    if (!range) return;
    const leaf = leafOf(range.startContainer, root);
    const raw = leaf?.tagName === "PRE" ? { before: textBefore(leaf, range), all: leaf.textContent ?? "" } : null;

    if (e.key === "Tab") {
      if (selectedImg.current && altInput.current) return act(() => altInput.current?.focus());
      if (escaped.current) {
        escaped.current = false;
        return;
      }
      if (closestIn(range.startContainer, /^LI$/, root)) return act(() => run((r, rg) => indentItems(r, rg, e.shiftKey)));
      if (raw && !e.shiftKey) return act(() => typeText("  "));
      return;
    }

    if (e.key === "Enter") {
      if (raw) {
        // In code: a line end. Enter on an empty last line leaves the block.
        const rest = raw.all.slice(raw.before.length);
        if (!e.shiftKey && rest === "\n" && raw.before.endsWith("\n") && leaf)
          return act(() =>
            run(() => {
              leaf.querySelector("code")!.textContent = raw.before.slice(0, -1) + "\n";
              const p = emptyParagraph(document);
              leaf.after(p);
              setCaret(p, 0);
              return "caret";
            }),
          );
        return act(() => typeText("\n"));
      }
      if (e.shiftKey || !leaf) return;
      const text = (leaf.textContent ?? "").replace(/​/g, "");
      if (leaf.tagName === "P" && !leaf.closest("li") && !textAfter(leaf, range)) {
        const fence = /^```([\w+#.-]*)\s*$/.exec(text);
        if (fence)
          return act(() =>
            run(() => {
              const pre = document.createElement("pre");
              if (fence[1]) pre.setAttribute("data-lang", fence[1]);
              const code = document.createElement("code");
              code.textContent = "\n";
              pre.append(code);
              leaf.replaceWith(pre);
              setCaret(code.firstChild!, 0);
              return "caret";
            }, "shortcut"),
          );
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(text.trim()))
          return act(() =>
            run(() => {
              const p = emptyParagraph(document);
              leaf.replaceWith(document.createElement("hr"), p);
              setCaret(p, 0);
              return "caret";
            }, "shortcut"),
          );
      }
      const quote = leaf.parentElement?.tagName === "BLOCKQUOTE" ? leaf.parentElement : null;
      if (quote && isEmptyBlock(leaf) && leaf === quote.lastElementChild)
        return act(() =>
          run(() => {
            quote.after(leaf);
            if (!quote.children.length) quote.remove();
            setCaret(leaf, 0);
            return "caret";
          }),
        );
      if (leaf.tagName === "LI" && isEmptyBlock(leaf))
        return act(() =>
          run(() => {
            const n = outdentItem(leaf);
            if (!n) return false;
            setCaret(n, n.tagName === "LI" ? (n.querySelector(":scope > [data-task]") ? 1 : 0) : 0);
            return "caret";
          }),
        );
      if (/^H[1-6]$/.test(leaf.tagName) && !textAfter(leaf, range))
        return act(() =>
          run(() => {
            const p = emptyParagraph(document);
            leaf.after(p);
            setCaret(p, 0);
            return "caret";
          }),
        );
      return;
    }

    if (e.key === "Backspace" && range.collapsed && leaf && !textBefore(leaf, range)) {
      if (/^H[1-6]$/.test(leaf.tagName)) return act(() => run((r, rg) => setBlockType(r, rg, "p")));
      if (leaf.tagName === "PRE") return act(() => run(toggleCodeBlock));
      if (leaf.tagName === "LI")
        return act(() =>
          run(() => {
            if (listKind(leaf) === "task") setTask(leaf, false);
            else outdentItem(leaf);
            return true;
          }),
        );
      const quote = leaf.parentElement?.tagName === "BLOCKQUOTE" ? leaf.parentElement : null;
      if (quote && leaf === quote.firstElementChild)
        return act(() =>
          run(() => {
            quote.before(leaf);
            if (!quote.children.length) quote.remove();
            return true;
          }),
        );
      return;
    }

    if (e.key === "ArrowRight" && range.collapsed) {
      const code = closestIn(range.startContainer, /^(CODE|A)$/, root);
      if (code && !code.closest("pre")) {
        const rr = document.createRange();
        rr.setStart(range.startContainer, range.startOffset);
        rr.setEndAfter(code.lastChild ?? code);
        if (!rr.toString().replace(/​/g, "")) return act(() => stepOut(code));
      }
      return;
    }
    if (e.key === "ArrowDown" && raw && leaf && !leaf.nextElementSibling) {
      const rest = raw.all.slice(raw.before.length);
      if (rest.indexOf("\n") === rest.length - 1)
        return act(() =>
          run(() => {
            const p = emptyParagraph(document);
            leaf.after(p);
            setCaret(p, 0);
            return "caret";
          }),
        );
    }
    if (e.key === "ArrowUp" && raw && leaf && !leaf.previousElementSibling && leaf.parentElement === root && !raw.before.includes("\n"))
      return act(() =>
        run(() => {
          const p = emptyParagraph(document);
          leaf.before(p);
          setCaret(p, 0);
          return "caret";
        }),
      );
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const root = e.currentTarget;
    if (t.tagName === "INPUT" && t.closest("[data-task]")) {
      if (!editable) {
        e.preventDefault();
        return;
      }
      const input = t as HTMLInputElement;
      const li = input.closest("li");
      input.toggleAttribute("checked", input.checked);
      li?.setAttribute("data-checked", String(input.checked));
      commit("task");
      return;
    }
    if (t.tagName === "IMG" && editable) {
      const r = document.createRange();
      r.selectNode(t);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      return;
    }
    const a = t.closest("a");
    if (a && root.contains(a) && (e.metaKey || e.ctrlKey || !editable)) {
      const href = safeUrl(a.getAttribute("href") ?? "");
      if (href) window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  /** Markdown → HTML at the caret: inline when it is one paragraph, else as blocks */
  const insertMarkdown = (md: string) =>
    run((root, range) => {
      const blocks = parseMarkdown(md);
      if (!blocks.length) return false;
      if (!range.collapsed) document.execCommand("delete");
      const r = rangeIn(root) ?? range;
      const opts = { editable: true, imageSrc: shownSrc };
      if (blocks.length === 1 && blocks[0].type === "paragraph" && !closestIn(r.startContainer, /^PRE$/, root)) {
        const frag = r.createContextualFragment(renderInlineHtml(blocks[0].children, opts));
        const last = frag.lastChild;
        r.insertNode(frag);
        if (last) caretAfter(last);
        return "caret";
      }
      document.execCommand("insertHTML", false, renderHtml(blocks, opts));
      return "caret";
    }, "paste");

  const pasteInto = (data: DataTransfer) => {
    const root = area.current;
    const files = [...data.files].filter(isImageFile);
    const html = data.getData("text/html");
    const text = data.getData("text/plain");
    if (files.length && !/<img\s/i.test(html)) {
      files.forEach((file) => startUpload(file));
      return;
    }
    const r = rangeIn(root);
    if (root && r && closestIn(r.startContainer, /^PRE$/, root)) {
      if (text) typeText(text);
      return;
    }
    const md = html ? htmlToMarkdown(new DOMParser().parseFromString(html, "text/html").body) : text;
    if (md.trim()) insertMarkdown(md);
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (editable) pasteInto(e.clipboardData);
  };

  /** Copy puts the selection's Markdown in as the plain text, and clean HTML */
  const onCopy = (e: ClipboardEvent<HTMLDivElement>) => {
    const root = e.currentTarget;
    const r = rangeIn(root);
    if (!r || r.collapsed) return;
    e.preventDefault();
    if (closestIn(r.commonAncestorContainer, /^PRE$/, root)) {
      e.clipboardData.setData("text/plain", r.toString());
      return;
    }
    const holder = document.createElement("div");
    holder.append(r.cloneContents());
    const md = htmlToMarkdown(holder);
    e.clipboardData.setData("text/plain", md);
    e.clipboardData.setData("text/html", markdownToHtml(md));
  };

  const onCut = (e: ClipboardEvent<HTMLDivElement>) => {
    onCopy(e);
    if (editable && e.defaultPrevented) run(() => (document.execCommand("delete"), "caret"), null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const files = [...e.dataTransfer.files];
    if (!editable) {
      e.preventDefault();
      return;
    }
    if (internalDrag.current && !files.length) return;
    e.preventDefault();
    const at = caretAtPoint(e.clientX, e.clientY);
    if (at && e.currentTarget.contains(at.startContainer)) {
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(at);
      savedRange.current = at.cloneRange();
    }
    if (files.length) files.filter(isImageFile).forEach((file) => startUpload(file));
    else pasteInto(e.dataTransfer);
  };

  // ------------------------------------------------------------------------------------------
  // The Markdown box

  const onSourceKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || readOnly || disabled) return;
    const t = e.currentTarget;
    const k = e.key.toLowerCase();
    const wrap = (a: string, b: string, inner?: string) => {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value: v } = t;
      const sel = inner ?? v.slice(s, en);
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
  };

  const onSourceFiles = (e: ClipboardEvent<HTMLTextAreaElement> | DragEvent<HTMLTextAreaElement>) => {
    const data = "clipboardData" in e ? e.clipboardData : e.dataTransfer;
    const files = [...data.files].filter(isImageFile);
    if (!files.length || readOnly || disabled) return;
    e.preventDefault();
    files.forEach((file) => startUpload(file));
  };

  // ------------------------------------------------------------------------------------------
  // The toolbar: one Tab stop, arrows between its controls

  const toolItems = () => [...(toolbar.current?.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), input:not(:disabled)") ?? [])];
  useLayoutEffect(() => {
    const items = toolItems();
    const current = items.find((el) => el === lastTool.current) ?? items[0];
    for (const el of items) el.tabIndex = el === current ? 0 : -1;
  });
  const onToolbarKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = toolItems();
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const el = items[i];
    if (el instanceof HTMLInputElement && ((e.key === "ArrowLeft" && el.selectionStart !== 0) || (e.key === "ArrowRight" && el.selectionEnd !== el.value.length) || e.key === "Home" || e.key === "End"))
      return;
    const n = items.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    items[next].focus();
  };
  const onToolbarFocus = (e: FocusEvent<HTMLDivElement>) => {
    lastTool.current = e.target;
    for (const el of toolItems()) el.tabIndex = el === e.target ? 0 : -1;
  };

  const changeMode = (next: EditorMode) => {
    if (next === mode) return;
    setLink(null);
    setOwnMode(next);
    onModeChange?.(next);
    say(MODE_SAID[next]);
  };

  const onBoxBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (box.current?.contains(e.relatedTarget as Node | null)) return;
    selectedImg.current?.removeAttribute("data-selected");
    selectedImg.current = null;
    setFmt((p) => (p.image ? { ...p, image: false } : p));
  };

  const blockOptions = [...BLOCKS];
  if (/^h[4-6]$/.test(fmt.block)) blockOptions.splice(4, 0, { value: fmt.block, label: `Heading ${fmt.block[1]}` });

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
        value={fmt.block}
        options={blockOptions}
        disabled={disabled}
        onPointerDown={() => (pointerPick.current = true)}
        onKeyDown={() => (pointerPick.current = false)}
        onChange={(e) => {
          // Picked with the mouse: back to the text. With the keyboard: stay, to keep choosing.
          const pointer = pointerPick.current;
          pointerPick.current = false;
          setBlock(e.target.value as BlockKind);
          if (pointer) focusArea();
        }}
      />
      {fmt.lang != null && (
        <Input
          aria-label="Code language"
          placeholder="Language"
          value={fmt.lang}
          disabled={disabled}
          onChange={(e) => setLang(e.target.value)}
          className="w-24"
          inputClassName="font-mono"
        />
      )}
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={Bold} label="Bold" keys="B" pressed={fmt.bold} disabled={disabled} apple={apple} onRun={() => format("bold")} />
      <Tool icon={Italic} label="Italic" keys="I" pressed={fmt.italic} disabled={disabled} apple={apple} onRun={() => format("italic")} />
      <Tool icon={Strikethrough} label="Strikethrough" keys="Shift+X" pressed={fmt.strike} disabled={disabled} apple={apple} onRun={() => format("strikeThrough")} />
      <Tool icon={Code} label="Code" keys="E" pressed={fmt.code} disabled={disabled || fmt.block === "pre"} apple={apple} onRun={() => run(toggleInlineCode)} />
      <Tool icon={Link} label="Link" keys="K" pressed={fmt.link} disabled={disabled || fmt.block === "pre"} apple={apple} onRun={openLink} />
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={List} label="Bulleted list" keys="Shift+8" pressed={fmt.list === "ul"} disabled={disabled} apple={apple} onRun={() => list("ul")} />
      <Tool icon={ListOrdered} label="Numbered list" keys="Shift+7" pressed={fmt.list === "ol"} disabled={disabled} apple={apple} onRun={() => list("ol")} />
      <Tool icon={ListChecks} label="Task list" keys="Shift+9" pressed={fmt.list === "task"} disabled={disabled} apple={apple} onRun={() => list("task")} />
      <Tool icon={Quote} label="Quote" pressed={fmt.quote} disabled={disabled} apple={apple} onRun={() => run(toggleQuote)} />
      <Tool icon={SquareCode} label="Code block" pressed={fmt.block === "pre"} disabled={disabled} apple={apple} onRun={() => run(toggleCodeBlock)} />
      <Tool icon={SeparatorHorizontal} label="Horizontal rule" disabled={disabled} apple={apple} onRun={() => run(insertRule)} />
      <Tool
        icon={ImagePlus}
        label="Image"
        disabled={disabled}
        apple={apple}
        onRun={() => {
          const r = rangeIn(area.current);
          if (r) savedRange.current = r.cloneRange();
          setDialog((d) => ({ open: true, key: d.key + 1 }));
        }}
      />
      <Separator orientation="vertical" className="mx-1" />
      <Tool icon={Undo2} label="Undo" keys="Z" disabled={disabled || !hist.undo} apple={apple} onRun={() => (focusArea(), undo())} />
      <Tool icon={Redo2} label="Redo" keys="Shift+Z" disabled={disabled || !hist.redo} apple={apple} onRun={() => (focusArea(), redo())} />
    </div>
  );

  const aria = {
    "aria-label": ariaLabel,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": f["aria-invalid"],
    "aria-required": f.required || undefined,
  };
  const textSize = size === "lg" ? "text-[16px]" : "text-[14px]";
  const column = measure && "mx-auto w-full max-w-[calc(75ch+1.5rem)]";

  return (
    <div
      ref={box}
      data-slot="rich-text-editor"
      data-mode={mode}
      aria-disabled={disabled || undefined}
      onBlur={onBoxBlur}
      className={cn(
        "relative flex min-w-0 flex-col border bg-background text-[14px]",
        f.invalid ? "border-destructive" : "border-input",
        "has-[[data-rte-input]:focus-visible]:outline-2 has-[[data-rte-input]:focus-visible]:outline-offset-1 has-[[data-rte-input]:focus-visible]:outline-ring",
        controlSize(size),
        className,
      )}
      {...rest}
    >
      <div className="sticky top-0 z-[2] flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted p-1">
        {mode === "write" && !readOnly ? (
          tools
        ) : (
          <span className="px-1 text-(length:--ctl-text) text-muted-foreground">{mode === "markdown" ? (readOnly ? "Markdown source" : "Markdown: paste or drop pictures here too") : "Preview"}</span>
        )}
        <fieldset disabled={disabled} className="ml-auto flex min-w-0">
          <SegmentedControl label="Editor mode" value={mode} options={MODES} onChange={changeMode} />
        </fieldset>
      </div>

      <div
        className={cn(
          "relative flex min-h-40 flex-1 flex-col overflow-auto",
          disabled && "cursor-not-allowed bg-muted text-muted-foreground",
          contentClassName,
        )}
      >
        <Prose measure={false} hidden={mode !== "write"} className={cn(textSize, "flex flex-1 flex-col")}>
          <div
            ref={area}
            id={mode === "write" ? textboxId : undefined}
            role="textbox"
            aria-multiline="true"
            {...aria}
            aria-readonly={readOnly || undefined}
            aria-disabled={disabled || undefined}
            aria-placeholder={placeholder}
            contentEditable={editable}
            suppressContentEditableWarning
            tabIndex={readOnly && !disabled ? 0 : undefined}
            spellCheck
            data-rte-input=""
            data-placeholder={placeholder}
            data-empty={initial.empty ? "" : undefined}
            dangerouslySetInnerHTML={{ __html: initial.html }}
            onKeyDown={onKeyDown}
            onClick={onClick}
            onPaste={onPaste}
            onCopy={onCopy}
            onCut={onCut}
            onDrop={onDrop}
            onDragOver={(e) => {
              if ([...e.dataTransfer.types].includes("Files")) e.preventDefault();
            }}
            onDragStart={() => (internalDrag.current = true)}
            onDragEnd={() => (internalDrag.current = false)}
            onCompositionStart={() => (composing.current = true)}
            onCompositionEnd={() => {
              composing.current = false;
              commit("typing");
            }}
            className={cn(
              "relative flex-1 px-3 py-2.5 break-words whitespace-pre-wrap focus-visible:outline-none",
              column,
              "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
              "data-empty:before:pointer-events-none data-empty:before:absolute data-empty:before:text-muted-foreground data-empty:before:content-[attr(data-placeholder)]",
              "[&_[data-task]]:select-none [&_img]:cursor-default",
              "[&_img[data-selected]]:outline-2 [&_img[data-selected]]:outline-offset-2 [&_img[data-selected]]:outline-ring",
              "[&_img[data-uploading]]:opacity-50 [&_img[data-uploading]]:outline-1 [&_img[data-uploading]]:outline-border [&_img[data-uploading]]:outline-dashed",
              "data-plain:[&_:is(h1,h2,h3,h4,h5,h6,th)]:font-normal",
            )}
          />
        </Prose>

        {mode === "markdown" && (
          <textarea
            ref={textarea}
            id={textboxId}
            {...aria}
            value={value}
            onChange={(e) => {
              const t = e.target;
              sourceSel.current = { start: t.selectionStart, end: t.selectionEnd, text: t.value };
              emit(t.value);
            }}
            onSelect={(e) => {
              const t = e.currentTarget;
              sourceSel.current = { start: t.selectionStart, end: t.selectionEnd, text: t.value };
            }}
            onKeyDown={onSourceKeyDown}
            onPaste={onSourceFiles}
            onDrop={onSourceFiles}
            readOnly={readOnly}
            disabled={disabled}
            placeholder={placeholder}
            spellCheck
            data-rte-input=""
            className={cn(
              "block w-full flex-1 resize-none bg-transparent px-3 py-2.5 font-mono leading-[1.55]",
              size === "lg" ? "text-[15px]" : "text-[13px]",
              " placeholder:text-muted-foreground focus-visible:outline-none",
              column,
              "disabled:cursor-not-allowed",
            )}
          />
        )}

        {mode === "preview" &&
          (value.trim() ? (
            <Prose
              measure={false}
              html={markdownToHtml(value, { imageSrc: (src) => uploads.find((u) => UPLOADING_PREFIX + u.id === src)?.local, linkTarget: "_blank" })}
              role="region"
              aria-label="Preview"
              tabIndex={0}
              data-rte-input=""
              className={cn(
                textSize,
                "flex-1 px-3 py-2.5 focus-visible:outline-none",
                column,
                "[&_img[data-uploading]]:opacity-50 [&_img[data-uploading]]:outline-1 [&_img[data-uploading]]:outline-border [&_img[data-uploading]]:outline-dashed",
              )}
            />
          ) : (
            <p className="px-3 py-2.5 text-muted-foreground">Nothing to preview yet.</p>
          ))}
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

      <Floating
        open={fmt.image && mode === "write" && editable}
        mode="manual"
        anchor={() => selectedImg.current}
        side="bottom"
        align="start"
        role="group"
        aria-label="Picture"
        className="p-1.5"
      >
        <div className="ctl-sm flex items-center gap-1.5">
          <Input
            key={imageKey}
            ref={altInput}
            aria-label="Alt text"
            placeholder="Alt text: what the picture shows"
            defaultValue={fmt.imageAlt}
            onChange={(e) => setAlt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                backToImage();
              }
            }}
            className="w-64 max-w-[60vw]"
          />
          <IconButton variant="ghost" icon={Trash} label="Remove picture" onClick={removeImage} />
        </div>
      </Floating>

      <Floating
        open={link != null}
        onOpenChange={(open) => {
          if (!open) closeLink();
        }}
        anchor={() => linkAnchor.current}
        side="bottom"
        align="start"
        role="dialog"
        aria-label="Link"
        data-rte-link=""
        className="w-80 p-2.5"
      >
        {link && (
          <form onSubmit={applyLink} className="ctl-sm flex flex-col gap-2">
            <Field label="Address" error={link.error}>
              <Input ref={linkInput} value={link.href} placeholder="https://" inputMode="url" onChange={(e) => setLink({ ...link, href: e.target.value, error: undefined })} />
            </Field>
            {(link.askText || link.existing) && (
              <Field label="Text">
                <Input value={link.text} onChange={(e) => setLink({ ...link, text: e.target.value })} />
              </Field>
            )}
            <div className="flex justify-end gap-2">
              {link.existing && (
                <Button variant="ghost" icon={Unlink} onClick={removeLink}>
                  Remove link
                </Button>
              )}
              <Button type="submit" variant="primary">
                {link.existing ? "Update" : "Add link"}
              </Button>
            </div>
          </form>
        )}
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
    if (safeUrl(href) == null) return setError("Use a web address that starts with https://, or a path on this site.");
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
