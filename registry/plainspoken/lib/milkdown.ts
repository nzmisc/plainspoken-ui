/*
 * Milkdown, set up for MilkdownEditor (ui/milkdown-editor.tsx): the presets and plugins it keeps,
 * math, node views drawn without Milkdown's own components, and the commands its toolbar, menus
 * and popovers call. Nothing here draws chrome: node views leave a mount point (a "slot") where
 * the editor puts library components with a React portal, and every menu or popover is the
 * editor's, fed through MilkdownHost. Browser only: load it with import() after mounting.
 */
import katex from "katex";
import remarkMath from "remark-math";
import { Editor, defaultValueCtx, editorViewCtx, editorViewOptionsCtx, parserCtx, remarkStringifyOptionsCtx, rootCtx, serializerCtx } from "@milkdown/kit/core";
import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";
import { block, blockServiceInstance, type ActiveNode } from "@milkdown/kit/plugin/block";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { cursor } from "@milkdown/kit/plugin/cursor";
import { history } from "@milkdown/kit/plugin/history";
import { slashFactory } from "@milkdown/kit/plugin/slash";
import { tooltipFactory } from "@milkdown/kit/plugin/tooltip";
import { trailing } from "@milkdown/kit/plugin/trailing";
import { upload, uploadConfig } from "@milkdown/kit/plugin/upload";
import { codeBlockSchema, commonmark, imageSchema, linkSchema, listItemSchema, remarkPreserveEmptyLinePlugin } from "@milkdown/kit/preset/commonmark";
import { gfm, remarkGFMPlugin } from "@milkdown/kit/preset/gfm";
import { lift, setBlockType, toggleMark, wrapIn } from "@milkdown/kit/prose/commands";
import { redo, redoDepth, undo, undoDepth } from "@milkdown/kit/prose/history";
import { InputRule } from "@milkdown/kit/prose/inputrules";
import { Fragment, type MarkType, type Node, type NodeType, type ResolvedPos } from "@milkdown/kit/prose/model";
import { liftListItem, sinkListItem, wrapInList } from "@milkdown/kit/prose/schema-list";
import { NodeSelection, Plugin, PluginKey, Selection, TextSelection, type EditorState, type Transaction } from "@milkdown/kit/prose/state";
import { CellSelection, TableMap, addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow, deleteTable, findTable, isInTable, selectedRect } from "@milkdown/kit/prose/tables";
import { Decoration, DecorationSet, type EditorView, type NodeView } from "@milkdown/kit/prose/view";
import { $inputRule, $nodeSchema, $prose, $remark, $view } from "@milkdown/kit/utils";

/** The src a picture has in the Markdown while it uploads: `![alt](#uploading-…)` */
export const UPLOADING_PREFIX = "#uploading-";

/** Set on transactions that bring in text from outside (a new value, the Markdown box): not the person's own edit */
const EXTERNAL = "plainspokenExternal";

// ------------------------------------------------------------------------------------------
// Slots: where node views leave room for chrome the editor draws with React

export type SlotKind = "code" | "math-inline" | "math-block";

export interface Slot {
  key: number;
  kind: SlotKind;
  /** The element to portal into; it sits inside the node view, outside the editable text */
  mount: HTMLElement;
  node: Node;
  view: EditorView;
  getPos: () => number | undefined;
  /** A NodeSelection is on it (math: show the source) */
  selected: boolean;
}

/** The node views' slots, as an external store for useSyncExternalStore */
export class SlotStore {
  #slots = new Map<number, Slot>();
  #list: Slot[] = [];
  #listeners = new Set<() => void>();
  #next = 0;

  subscribe = (fn: () => void) => {
    this.#listeners.add(fn);
    return () => {
      this.#listeners.delete(fn);
    };
  };
  get = () => this.#list;

  add(slot: Omit<Slot, "key">): number {
    const key = ++this.#next;
    this.#slots.set(key, { ...slot, key });
    this.#emit();
    return key;
  }
  set(key: number, patch: Partial<Slot>) {
    const s = this.#slots.get(key);
    if (!s) return;
    this.#slots.set(key, { ...s, ...patch });
    this.#emit();
  }
  remove(key: number) {
    if (this.#slots.delete(key)) this.#emit();
  }
  #emit() {
    this.#list = [...this.#slots.values()];
    for (const fn of this.#listeners) fn();
  }
}

// ------------------------------------------------------------------------------------------
// What the editor component gives the Milkdown setup

export interface MilkdownHost {
  /** Read on every update: may the person change the text now */
  editable(): boolean;
  /** Attributes for the editable element (aria-*, id), read on every update */
  attributes(): Record<string, string>;
  /** Shown while the text is empty */
  placeholder(): string | undefined;
  /** After every state update, and once at the start with prev null: toolbar, menus and popovers follow */
  update(view: EditorView, prev: EditorState | null): void;
  /** The text changed by the person, by undo, or by an upload finishing: time to write out the Markdown */
  changed(): void;
  /** Focus came or went (the bubble and the table toolbar show only while the text has focus) */
  focus(view: EditorView, focused: boolean): void;
  /** Sees every keydown first; true when it was handled */
  keydown(view: EditorView, event: KeyboardEvent): boolean;
  /** Pasted or dropped picture files: starts their uploads and gives the src and alt to put in */
  upload(files: File[]): { src: string; alt: string }[];
  /** What to draw for a picture's src (an upload in progress shows its local copy) */
  imageSrc(src: string): string;
  /** A finished upload's URL, for the placeholder src that undo can bring back */
  uploaded(src: string): string | undefined;
  /** The block under the pointer, for the block handle; null when there is none */
  block(active: ActiveNode | null): void;
  /** A link was clicked in read-only text, or with ⌘/Ctrl */
  openLink(href: string): void;
  slots: SlotStore;
}

// ------------------------------------------------------------------------------------------
// URLs

/** Only http(s), mailto, tel, blob, data:image and relative addresses; anything else is dropped */
export function safeUrl(url: string, image = false): string | null {
  const u = url.trim();
  if (!u) return "";
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(u.replace(/[\u0000- \u007f- ​-‍﻿]/g, ""));
  if (!scheme) return u;
  const s = scheme[1].toLowerCase();
  if (s === "http" || s === "https" || s === "blob") return u;
  if (!image && (s === "mailto" || s === "tel")) return u;
  if (image && /^data:image\/(png|gif|jpe?g|webp|avif);/i.test(u)) return u;
  return null;
}

/** What people type for a link: "example.com" is a web address, "ana@example.com" an email address */
export function normalizeHref(s: string): string {
  const t = s.trim();
  if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || /^[/#?.]/.test(t)) return t;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(t)) return `mailto:${t}`;
  if (/^(www\.)?[\w-]+(\.[\w-]+)+(:\d+)?([/?#]|$)/i.test(t)) return `https://${t}`;
  return t;
}

const URLISH = /^(https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?]$/i;

// ------------------------------------------------------------------------------------------
// Math: remark-math for the Markdown, KaTeX to draw it

const remarkMathPlugin = $remark("remarkMath", () => remarkMath);

const mathInlineSchema = $nodeSchema("math_inline", () => ({
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  marks: "",
  attrs: { value: { default: "", validate: "string" } },
  parseDOM: [{ tag: "span[data-type=math_inline]", getAttrs: (dom) => ({ value: (dom as HTMLElement).dataset.value ?? "" }) }],
  toDOM: (node) => ["span", { "data-type": "math_inline", "data-value": node.attrs.value }, node.attrs.value],
  parseMarkdown: {
    match: (n) => n.type === "inlineMath",
    runner: (state, n, type) => {
      state.addNode(type, { value: String(n.value ?? "") });
    },
  },
  toMarkdown: {
    match: (n) => n.type.name === "math_inline",
    runner: (state, n) => {
      state.addNode("inlineMath", undefined, n.attrs.value);
    },
  },
}));

const mathBlockSchema = $nodeSchema("math_block", () => ({
  group: "block",
  atom: true,
  selectable: true,
  defining: true,
  marks: "",
  attrs: { value: { default: "", validate: "string" } },
  parseDOM: [{ tag: "div[data-type=math_block]", getAttrs: (dom) => ({ value: (dom as HTMLElement).dataset.value ?? "" }) }],
  toDOM: (node) => ["div", { "data-type": "math_block", "data-value": node.attrs.value }, node.attrs.value],
  parseMarkdown: {
    match: (n) => n.type === "math",
    runner: (state, n, type) => {
      state.addNode(type, { value: String(n.value ?? "") });
    },
  },
  toMarkdown: {
    match: (n) => n.type.name === "math_block",
    runner: (state, n) => {
      state.addNode("math", undefined, n.attrs.value);
    },
  },
}));

/** TeX into an element, errors shown in place rather than thrown */
export function renderMath(el: HTMLElement, tex: string, display: boolean) {
  if (!tex.trim()) {
    el.textContent = display ? "Empty formula" : "formula";
    el.setAttribute("data-empty", "");
    return;
  }
  el.removeAttribute("data-empty");
  try {
    katex.render(tex, el, { displayMode: display, throwOnError: false, errorColor: "var(--color-destructive)", output: "htmlAndMathml" });
  } catch {
    el.textContent = tex;
  }
}

// Links don't grow when you type at their end
const linkMark = linkSchema.extendSchema((prev) => (ctx) => ({ ...prev(ctx), inclusive: false }));

// ------------------------------------------------------------------------------------------
// Node views

class ImageView implements NodeView {
  dom: HTMLImageElement;
  private node: Node;
  private host: MilkdownHost;
  constructor(node: Node, host: MilkdownHost) {
    this.node = node;
    this.host = host;
    this.dom = document.createElement("img");
    this.render();
  }
  private render() {
    const { src, alt, title } = this.node.attrs as { src: string; alt: string; title: string };
    const shown = this.host.imageSrc(src);
    const safe = safeUrl(shown, true);
    if (safe) this.dom.src = safe;
    else this.dom.removeAttribute("src");
    this.dom.alt = alt;
    if (title) this.dom.title = title;
    else this.dom.removeAttribute("title");
    this.dom.toggleAttribute("data-uploading", src.startsWith(UPLOADING_PREFIX));
  }
  update(node: Node) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }
  selectNode() {
    this.dom.setAttribute("data-selected", "");
  }
  deselectNode() {
    this.dom.removeAttribute("data-selected");
  }
}

/** A list item; a task item gets a real checkbox before its text */
class ListItemView implements NodeView {
  dom: HTMLLIElement;
  contentDOM: HTMLElement;
  private box: HTMLInputElement | null = null;
  private node: Node;
  private view: EditorView;
  private getPos: () => number | undefined;
  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement("li");
    const task = node.attrs.checked != null;
    if (!task) {
      this.contentDOM = this.dom;
    } else {
      this.dom.className = "task-list-item";
      this.dom.dataset.itemType = "task";
      const holder = document.createElement("span");
      holder.contentEditable = "false";
      holder.setAttribute("data-task", "");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.addEventListener("mousedown", (e) => e.preventDefault());
      box.addEventListener("click", (e) => {
        if (!this.view.editable) {
          e.preventDefault();
          return;
        }
        const pos = this.getPos();
        if (pos == null) return;
        this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, checked: box.checked }));
      });
      holder.append(box);
      this.box = box;
      this.contentDOM = document.createElement("div");
      this.dom.append(holder, this.contentDOM);
    }
    this.render();
  }
  private render() {
    const { label, listType, spread, checked } = this.node.attrs as { label: string; listType: string; spread: boolean; checked: boolean | null };
    this.dom.dataset.label = label;
    this.dom.dataset.listType = listType;
    this.dom.dataset.spread = String(spread);
    if (this.box) {
      this.box.checked = !!checked;
      this.box.disabled = !this.view.editable;
      this.dom.dataset.checked = String(!!checked);
      this.box.setAttribute("aria-label", checked ? "Done" : "To do");
    }
  }
  update(node: Node) {
    if (node.type !== this.node.type || (node.attrs.checked == null) !== (this.node.attrs.checked == null)) return false;
    this.node = node;
    this.render();
    return true;
  }
  stopEvent(e: Event) {
    return !!this.box && e.target === this.box;
  }
  ignoreMutation(m: MutationRecord | { type: "selection"; target: globalThis.Node }) {
    if (m.type === "selection") return false;
    return !this.contentDOM.contains(m.target) || (this.contentDOM === this.dom && m.type === "attributes" && m.target === this.dom);
  }
}

/** Base for node views with a slot: registers it, keeps it current, and removes it */
abstract class SlotView implements NodeView {
  abstract dom: HTMLElement;
  protected key = 0;
  protected node: Node;
  protected view: EditorView;
  protected getPos: () => number | undefined;
  protected host: MilkdownHost;
  constructor(node: Node, view: EditorView, getPos: () => number | undefined, host: MilkdownHost) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.host = host;
  }
  protected register(kind: SlotKind, mount: HTMLElement) {
    this.key = this.host.slots.add({ kind, mount, node: this.node, view: this.view, getPos: this.getPos, selected: false });
  }
  update(node: Node) {
    if (node.type !== this.node.type) return false;
    const before = this.node;
    this.node = node;
    if (this.changed(before, node)) this.host.slots.set(this.key, { node });
    return true;
  }
  /** Whether the slot needs to know about the new node */
  protected changed(a: Node, b: Node) {
    return !a.eq(b);
  }
  destroy() {
    this.host.slots.remove(this.key);
  }
}

/** A code block: a header (the language picker) over the code, which stays plain editable text */
class CodeBlockView extends SlotView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private header: HTMLElement;
  constructor(node: Node, view: EditorView, getPos: () => number | undefined, host: MilkdownHost) {
    super(node, view, getPos, host);
    this.dom = document.createElement("div");
    this.dom.setAttribute("data-code-block", "");
    this.header = document.createElement("div");
    this.header.contentEditable = "false";
    this.header.setAttribute("data-code-header", "");
    const pre = document.createElement("pre");
    this.contentDOM = document.createElement("code");
    pre.append(this.contentDOM);
    this.dom.append(this.header, pre);
    this.render();
    this.register("code", this.header);
  }
  private render() {
    const lang = String(this.node.attrs.language ?? "");
    if (lang) this.dom.dataset.language = lang;
    else delete this.dom.dataset.language;
  }
  override update(node: Node) {
    if (!super.update(node)) return false;
    this.render();
    return true;
  }
  // Only the language matters to the header; the copy button reads the text when pressed
  protected override changed(a: Node, b: Node) {
    return a.attrs.language !== b.attrs.language;
  }
  stopEvent(e: Event) {
    return this.header.contains(e.target as globalThis.Node);
  }
  ignoreMutation(m: MutationRecord | { type: "selection"; target: globalThis.Node }) {
    if (m.type === "selection") return !this.contentDOM.contains(m.target);
    return !this.contentDOM.contains(m.target);
  }
}

/** Math, inline ($…$) or as a block ($$…$$): KaTeX when not selected, and the source in the slot when it is */
class MathView extends SlotView {
  dom: HTMLElement;
  private shown: HTMLElement;
  private display: boolean;
  constructor(node: Node, view: EditorView, getPos: () => number | undefined, host: MilkdownHost, display: boolean) {
    super(node, view, getPos, host);
    this.display = display;
    this.dom = document.createElement(display ? "div" : "span");
    this.dom.setAttribute("data-math", display ? "block" : "inline");
    this.shown = document.createElement(display ? "div" : "span");
    this.shown.setAttribute("data-math-render", "");
    const mount = document.createElement(display ? "div" : "span");
    mount.setAttribute("data-math-source", "");
    this.dom.append(this.shown, mount);
    renderMath(this.shown, String(node.attrs.value), display);
    this.register(display ? "math-block" : "math-inline", mount);
  }
  override update(node: Node) {
    const before = this.node;
    if (!super.update(node)) return false;
    if (before.attrs.value !== node.attrs.value) renderMath(this.shown, String(node.attrs.value), this.display);
    return true;
  }
  selectNode() {
    this.dom.setAttribute("data-selected", "");
    this.host.slots.set(this.key, { selected: true });
  }
  deselectNode() {
    this.dom.removeAttribute("data-selected");
    this.host.slots.set(this.key, { selected: false });
  }
  stopEvent(e: Event) {
    return (e.target as Element).closest?.("[data-math-source]") != null;
  }
  ignoreMutation() {
    return true;
  }
}

// ------------------------------------------------------------------------------------------
// Input rules beyond the presets'

/** "[ ] " or "[x] " at the start of a paragraph that isn't in a list starts a task list */
const taskListRule = $inputRule(
  () =>
    new InputRule(/^\[([ xX])\]\s$/, (state, match, start, end) => {
      const $start = state.doc.resolve(start);
      const { nodes } = state.schema;
      if ($start.parent.type !== nodes.paragraph) return null;
      for (let d = $start.depth; d > 0; d--) if ($start.node(d).type === nodes.list_item) return null;
      const range = $start.blockRange();
      const tr = state.tr.delete(start, end);
      const wrapped = range && tr.doc.resolve(tr.mapping.map(range.$from.pos)).blockRange();
      if (!wrapped) return null;
      tr.wrap(wrapped, [{ type: nodes.bullet_list }, { type: nodes.list_item, attrs: { checked: /x/i.test(match[1]) } }]);
      return tr;
    }),
);

/** $…$ typed in text becomes inline math (the closing $ needs a non-space before it, so "$5 and $10" stays text) */
const mathInlineRule = $inputRule(
  () =>
    new InputRule(/(^|[^$\\])\$([^\s$](?:[^$]*[^\s$])?)\$$/, (state, match, start, end) => {
      const type = state.schema.nodes.math_inline;
      const $start = state.doc.resolve(start);
      if (!type || $start.parent.type.spec.code) return null;
      const from = start + match[1].length;
      return state.tr.replaceWith(from, end, type.create({ value: match[2] }));
    }),
);

/** [words](address) typed in text becomes a link */
const linkRule = $inputRule(
  () =>
    new InputRule(/\[([^\]]+)\]\(([^)\s]+)\)$/, (state, match, start, end) => {
      const link = state.schema.marks.link;
      const href = normalizeHref(match[2]);
      if (!link || state.doc.resolve(start).parent.type.spec.code || safeUrl(href) == null) return null;
      return state.tr.replaceWith(start, end, state.schema.text(match[1], [link.create({ href })]));
    }),
);

/** A web address followed by a space becomes a link, as GitHub does */
const autolinkRule = $inputRule(
  () =>
    new InputRule(/(?:^|\s)(\S+)\s$/, (state, match, start, end) => {
      const link = state.schema.marks.link;
      const url = match[1];
      const $start = state.doc.resolve(start);
      if (!link || !URLISH.test(url) || $start.parent.type.spec.code) return null;
      const from = start + match[0].indexOf(url);
      const to = from + url.length;
      if (state.doc.rangeHasMark(from, to, link) || state.doc.rangeHasMark(from, to, state.schema.marks.inlineCode)) return null;
      const href = normalizeHref(url);
      return state.tr.addMark(from, to, link.create({ href })).insertText(" ", end);
    }),
);

/** $$ and a space at the start of an empty line make a math block, opened for writing */
const mathBlockRule = $inputRule(
  () =>
    new InputRule(/^\$\$\s$/, (state, _match, start, end) => {
      const $start = state.doc.resolve(start);
      const type = state.schema.nodes.math_block;
      if (!type || $start.parent.type !== state.schema.nodes.paragraph || end !== $start.end()) return null;
      const tr = state.tr.replaceRangeWith($start.before(), $start.after(), type.create());
      return selectNodeNear(tr, $start.before());
    }),
);

function selectNodeNear(tr: Transaction, pos: number) {
  const node = tr.doc.nodeAt(pos);
  if (node && NodeSelection.isSelectable(node)) tr.setSelection(NodeSelection.create(tr.doc, pos));
  return tr.scrollIntoView();
}

// ------------------------------------------------------------------------------------------
// Decorations: the placeholder, and a hint on the empty line being written

const placeholderKey = new PluginKey("PLAINSPOKEN_PLACEHOLDER");

function placeholderPlugin(host: MilkdownHost) {
  return $prose(
    () =>
      new Plugin({
        key: placeholderKey,
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const first = doc.firstChild;
            const text = host.placeholder();
            if (doc.childCount === 1 && first?.type.name === "paragraph" && first.content.size === 0) {
              return text ? DecorationSet.create(doc, [Decoration.node(0, first.nodeSize, { "data-placeholder": text })]) : null;
            }
            const { $from, empty } = selection;
            if (!empty || !host.editable() || $from.depth !== 1 || $from.parent.type.name !== "paragraph" || $from.parent.content.size) return null;
            const at = $from.before();
            return DecorationSet.create(doc, [Decoration.node(at, at + $from.parent.nodeSize, { "data-hint": "Type / for blocks" })]);
          },
        },
      }),
  );
}

// ------------------------------------------------------------------------------------------
// Creating an editor

export interface MilkdownInstance {
  editor: Editor;
  view: EditorView;
  ctx: Ctx;
  /** The text as Markdown, tidied: no empty paragraphs, no trailing line end */
  markdown(): string;
  /** Puts new Markdown in, changing only what differs: the caret stays, nothing goes into the undo history */
  setMarkdown(markdown: string): void;
  destroy(): void;
}

/** Remark's way of writing what Milkdown says: "-" bullets, "---" rules, fenced code */
const STRINGIFY = { bullet: "-", bulletOther: "*", rule: "-", emphasis: "*", strong: "*", fence: "`", fences: true, listItemIndent: "one", incrementListMarker: true } as const;

/** Milkdown writes an empty paragraph as "<br />" to keep it; empty lines aren't worth keeping in Markdown */
const keptCommonmark = commonmark.filter((p) => p !== remarkPreserveEmptyLinePlugin.plugin && p !== remarkPreserveEmptyLinePlugin.options);

export async function createMilkdown(root: HTMLElement, markdown: string, host: MilkdownHost, extra: MilkdownPlugin[] = []): Promise<MilkdownInstance> {
  const bridgeKey = new PluginKey<number>("PLAINSPOKEN_BRIDGE");

  // Counts the person's own changes, so the view update can tell them from text put in from outside
  const bridge = $prose(
    () =>
      new Plugin<number>({
        key: bridgeKey,
        state: {
          init: () => 0,
          apply: (tr, n) => {
            if (!tr.docChanged) return n;
            const origin = (tr.getMeta("appendedTransaction") as Transaction | undefined) ?? tr;
            return origin.docChanged && !origin.getMeta(EXTERNAL) ? n + 1 : n;
          },
        },
        view: (view) => {
          host.update(view, null);
          return {
            update: (v, prev) => {
              if (bridgeKey.getState(v.state) !== bridgeKey.getState(prev)) host.changed();
              host.update(v, prev);
            },
          };
        },
        props: {
          handleKeyDown: (view, e) => host.keydown(view, e),
          handleClick: (view, _pos, e) => {
            const a = (e.target as Element).closest?.("a[href]");
            if (!a || !view.dom.contains(a)) return false;
            if (view.editable && !(e.metaKey || e.ctrlKey)) return false;
            e.preventDefault();
            host.openLink(a.getAttribute("href") ?? "");
            return true;
          },
          handleDOMEvents: {
            focus: (view) => {
              host.focus(view, true);
              return false;
            },
            blur: (view) => {
              host.focus(view, false);
              return false;
            },
          },
          // A URL pasted over selected words links them
          handlePaste: (view, e) => {
            const text = e.clipboardData?.getData("text/plain").trim() ?? "";
            const { selection, schema } = view.state;
            if (selection.empty || !URLISH.test(text) || selection.$from.parent.type.spec.code || !(selection instanceof TextSelection)) return false;
            view.dispatch(view.state.tr.addMark(selection.from, selection.to, schema.marks.link.create({ href: normalizeHref(text) })));
            return true;
          },
        },
        // Undo can bring back a picture's upload placeholder after the upload finished: put its URL back
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((t) => t.docChanged)) return null;
          let tr: Transaction | null = null;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "image") return node.isBlock;
            const src = String(node.attrs.src);
            const done = src.startsWith(UPLOADING_PREFIX) ? host.uploaded(src) : undefined;
            if (done) (tr ??= state.tr).setNodeAttribute(pos, "src", done);
            return false;
          });
          return tr;
        },
      }),
  );

  const slash = slashFactory("plainspoken");
  const bubble = tooltipFactory("plainspoken");

  const views = [
    $view(codeBlockSchema.node, () => (node, view, getPos) => new CodeBlockView(node, view, getPos, host)),
    $view(imageSchema.node, () => (node) => new ImageView(node, host)),
    $view(listItemSchema.node, () => (node, view, getPos) => new ListItemView(node, view, getPos)),
    $view(mathInlineSchema.node, () => (node, view, getPos) => new MathView(node, view, getPos, host, false)),
    $view(mathBlockSchema.node, () => (node, view, getPos) => new MathView(node, view, getPos, host, true)),
  ];

  const editor = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, markdown);
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        editable: () => host.editable(),
        attributes: () => host.attributes(),
      }));
      ctx.update(remarkStringifyOptionsCtx, (prev) => ({ ...prev, ...STRINGIFY }));
      // Tables as written by hand: no padding to line up the pipes
      ctx.update(remarkGFMPlugin.options.key, (prev) => ({ ...prev, tablePipeAlign: false }));
      ctx.update(uploadConfig.key, (prev) => ({
        ...prev,
        uploader: async (files, schema) => {
          const images = host.upload([...files].filter((f) => f.type.startsWith("image/")));
          return images.map((img) => schema.nodes.image.create(img));
        },
        uploadWidgetFactory: (pos, spec) => Decoration.widget(pos, document.createElement("span"), spec),
      }));
      // The slash menu and the selection bubble are the editor's own popovers: these only report
      ctx.set(slash.key, { view: () => ({}) });
      ctx.set(bubble.key, { view: () => ({}) });
    })
    .use(keptCommonmark)
    .use(gfm)
    .use(linkMark)
    .use([remarkMathPlugin, mathInlineSchema, mathBlockSchema].flat())
    .use([taskListRule, mathInlineRule, mathBlockRule, linkRule, autolinkRule])
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(trailing)
    .use(upload)
    .use(block)
    .use(slash)
    .use(bubble)
    .use(bridge)
    .use(placeholderPlugin(host))
    .use(views)
    .use(extra);

  await editor.create();
  const ctx = editor.ctx;
  const view = ctx.get(editorViewCtx);

  // The block handle: plugin-block finds the block under the pointer; the editor draws the handle
  const service = ctx.get(blockServiceInstance.key);
  service.bind(ctx, (m) => host.block(m.type === "show" ? m.active : null));

  const instance: MilkdownInstance = {
    editor,
    view,
    ctx,
    markdown: () => docToMarkdown(ctx, view.state.doc),
    setMarkdown: (md) => {
      const next = ctx.get(parserCtx)(md);
      if (!next) return;
      // Compared without the attributes plugins fill in after parsing (heading ids, list labels),
      // or every heading would count as changed and the whole text would be replaced
      const a = plain(view.state.doc);
      const b = plain(next);
      const start = a.content.findDiffStart(b.content);
      if (start == null) return;
      const end = a.content.findDiffEnd(b.content);
      if (!end) return;
      let { a: endA, b: endB } = end;
      const overlap = start - Math.min(endA, endB);
      if (overlap > 0) {
        endA += overlap;
        endB += overlap;
      }
      const tr = view.state.tr.replace(start, endA, next.slice(start, endB));
      view.dispatch(tr.setMeta("addToHistory", false).setMeta(EXTERNAL, true));
    },
    destroy: () => {
      service.unBind();
      void editor.destroy();
    },
  };
  return instance;
}

/** Attributes that plugins derive from the text after parsing, left out when comparing documents */
const DERIVED: Record<string, string[]> = { heading: ["id"], list_item: ["label"] };

function plain(doc: Node): Node {
  type J = { type: string; attrs?: Record<string, unknown>; content?: J[] };
  const strip = (j: J): J => {
    const drop = DERIVED[j.type];
    const attrs = j.attrs && drop ? Object.fromEntries(Object.entries(j.attrs).filter(([k]) => !drop.includes(k))) : j.attrs;
    return { ...j, attrs, content: j.content?.map(strip) };
  };
  return doc.type.schema.nodeFromJSON(strip(doc.toJSON() as J));
}

export function docToMarkdown(ctx: Ctx, doc: Node): string {
  const kept: Node[] = [];
  doc.forEach((n) => {
    if (!(n.type.name === "paragraph" && n.content.size === 0)) kept.push(n);
  });
  if (!kept.length) return "";
  const d = kept.length === doc.childCount ? doc : doc.copy(Fragment.fromArray(kept));
  return tidyTables(ctx.get(serializerCtx)(d).replace(/\n+$/, ""));
}

/** Remark writes a table's delimiter row as short as it can ("| :- | -: |"); this writes it as people do ("| :--- | ---: |") */
function tidyTables(markdown: string): string {
  let fence: string | null = null;
  return markdown
    .split("\n")
    .map((line) => {
      const f = /^\s*(`{3,}|~{3,})/.exec(line);
      if (f && (!fence || f[1].startsWith(fence))) fence = fence ? null : f[1];
      if (fence || !/^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(line)) return line;
      return line.replace(/:?-+:?/g, (c) => (c.startsWith(":") && c.endsWith(":") && c.length > 1 ? ":---:" : c.startsWith(":") ? ":---" : c.endsWith(":") ? "---:" : "---"));
    })
    .join("\n");
}

// ------------------------------------------------------------------------------------------
// Reading the state, for the toolbar

export type BlockKind = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "pre";
export type ListKind = "ul" | "ol" | "task";

export interface Formats {
  /** The kind of the text block the selection starts in; null for anything else (a table, math) */
  block: BlockKind | null;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  link: boolean;
  list: ListKind | null;
  quote: boolean;
  table: boolean;
  image: boolean;
  undo: boolean;
  redo: boolean;
}

export const NO_FORMATS: Formats = { block: "p", bold: false, italic: false, strike: false, code: false, link: false, list: null, quote: false, table: false, image: false, undo: false, redo: false };

export const sameFormats = (a: Formats, b: Formats) => (Object.keys(a) as (keyof Formats)[]).every((k) => a[k] === b[k]);

function hasMark(state: EditorState, type: MarkType | undefined) {
  if (!type) return false;
  const { empty, $from, from, to } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks ?? $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

/** The innermost list item around a position, and its list */
function listAround($pos: ResolvedPos) {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === "list_item") return { item: node, itemPos: $pos.before(d), list: $pos.node(d - 1), listPos: $pos.before(d - 1), depth: d };
  }
  return null;
}

function ancestor($pos: ResolvedPos, name: string) {
  for (let d = $pos.depth; d > 0; d--) if ($pos.node(d).type.name === name) return { node: $pos.node(d), pos: $pos.before(d), depth: d };
  return null;
}

export function readFormats(state: EditorState): Formats {
  const { selection, schema } = state;
  const { $from } = selection;
  const m = schema.marks;
  const parent = $from.parent;
  const name = parent.type.name;
  const block: BlockKind | null =
    selection instanceof NodeSelection && selection.node.isBlock
      ? null
      : name === "paragraph"
        ? "p"
        : name === "heading"
          ? (`h${Math.min(6, Math.max(1, Number(parent.attrs.level)))}` as BlockKind)
          : name === "code_block"
            ? "pre"
            : null;
  const around = listAround($from);
  return {
    block,
    bold: hasMark(state, m.strong),
    italic: hasMark(state, m.emphasis),
    strike: hasMark(state, m.strike_through),
    code: hasMark(state, m.inlineCode),
    link: hasMark(state, m.link),
    list: around ? (around.list.type.name === "ordered_list" ? "ol" : around.item.attrs.checked != null ? "task" : "ul") : null,
    quote: !!ancestor($from, "blockquote"),
    table: selection instanceof CellSelection || isInTable(state),
    image: selection instanceof NodeSelection && selection.node.type.name === "image",
    undo: undoDepth(state) > 0,
    redo: redoDepth(state) > 0,
  };
}

// ------------------------------------------------------------------------------------------
// Commands. Each takes the view, changes it if it can, and says whether it did.

type Run = (view: EditorView) => boolean;

const run =
  (cmd: (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean): Run =>
  (view) =>
    cmd(view.state, view.dispatch, view);

export const undoCommand = run(undo);
export const redoCommand = run(redo);

export const toggleMarkCommand = (name: "strong" | "emphasis" | "strike_through" | "inlineCode") => (view: EditorView) => {
  const type = view.state.schema.marks[name];
  if (!type || view.state.selection.$from.parent.type.spec.code) return false;
  return toggleMark(type)(view.state, view.dispatch);
};

/** Paragraph, heading or code block for the text blocks in the selection */
export function setTextStyle(view: EditorView, kind: BlockKind) {
  const { nodes } = view.state.schema;
  if (kind === "pre") return toggleCodeBlock(view, true);
  const type = kind === "p" ? nodes.paragraph : nodes.heading;
  const attrs = kind === "p" ? undefined : { level: Number(kind.slice(1)) };
  return setBlockType(type, attrs)(view.state, view.dispatch);
}

/** Into a code block (several paragraphs become one block, a line each), or back out into a paragraph */
export function toggleCodeBlock(view: EditorView, onlyOn = false) {
  const { state } = view;
  const { nodes } = state.schema;
  const { $from, $to } = state.selection;
  if ($from.parent.type === nodes.code_block) {
    if (onlyOn) return false;
    return setBlockType(nodes.paragraph)(state, view.dispatch);
  }
  const range = $from.blockRange($to);
  if (range && range.endIndex - range.startIndex > 1 && range.parent.type === state.doc.type) {
    const lines: string[] = [];
    for (let i = range.startIndex; i < range.endIndex; i++) lines.push(range.parent.child(i).textContent);
    const code = nodes.code_block.create(null, lines.join("\n") ? state.schema.text(lines.join("\n")) : null);
    const tr = state.tr.replaceWith(range.start, range.end, code);
    tr.setSelection(TextSelection.create(tr.doc, range.start + 1 + code.content.size));
    view.dispatch(tr.scrollIntoView());
    return true;
  }
  return setBlockType(nodes.code_block, { language: "" })(state, view.dispatch);
}

/** Bulleted, numbered or task list on or off; from one kind to another it changes the list */
export function toggleList(view: EditorView, kind: ListKind) {
  const { state } = view;
  const { nodes } = state.schema;
  const around = listAround(state.selection.$from);
  const listType = kind === "ol" ? nodes.ordered_list : nodes.bullet_list;
  if (around) {
    const current: ListKind = around.list.type === nodes.ordered_list ? "ol" : around.item.attrs.checked != null ? "task" : "ul";
    if (current === kind) return liftListItem(nodes.list_item)(state, view.dispatch);
    const tr = state.tr;
    if (around.list.type !== listType) tr.setNodeMarkup(around.listPos, listType, kind === "ol" ? { order: 1, spread: around.list.attrs.spread } : { spread: around.list.attrs.spread });
    let pos = around.listPos + 1;
    around.list.forEach((item) => {
      tr.setNodeMarkup(pos, undefined, { ...item.attrs, checked: kind === "task" ? (item.attrs.checked ?? false) : null, listType: kind === "ol" ? "ordered" : "bullet" });
      pos += item.nodeSize;
    });
    view.dispatch(tr);
    return true;
  }
  return wrapInList(listType)(state, (tr) => {
    if (kind === "task") {
      const $pos = tr.selection.$from;
      const made = listAround($pos);
      if (made) {
        let pos = made.listPos + 1;
        made.list.forEach((item) => {
          tr.setNodeMarkup(pos, undefined, { ...item.attrs, checked: false });
          pos += item.nodeSize;
        });
      }
    }
    view.dispatch(tr);
  });
}

/** In a list item: indent (sink) or outdent (lift) it, as Tab and Shift+Tab do */
export function indentItem(view: EditorView, out: boolean) {
  const type = view.state.schema.nodes.list_item;
  return (out ? liftListItem(type) : sinkListItem(type))(view.state, view.dispatch);
}

export function toggleQuote(view: EditorView) {
  const { state } = view;
  if (ancestor(state.selection.$from, "blockquote")) return lift(state, view.dispatch);
  return wrapIn(state.schema.nodes.blockquote)(state, view.dispatch);
}

/** Ticks or unticks the task the caret is in */
export function toggleTask(view: EditorView) {
  const around = listAround(view.state.selection.$from);
  if (!around || around.item.attrs.checked == null) return false;
  view.dispatch(view.state.tr.setNodeMarkup(around.itemPos, undefined, { ...around.item.attrs, checked: !around.item.attrs.checked }));
  return true;
}

/** Where a new block goes: in place of the empty paragraph the caret is in, or after the block it is in */
function blockSpot(state: EditorState): { from: number; to: number } {
  const { selection } = state;
  const { $from } = selection;
  if (selection instanceof NodeSelection && selection.node.isBlock) return { from: selection.to, to: selection.to };
  let d = $from.depth;
  while (d > 0 && !$from.node(d).isTextblock) d--;
  if (d === 0) return { from: $from.pos, to: $from.pos };
  const textblock = $from.node(d);
  // A list item must start with a paragraph, so its first one is never replaced
  const firstInItem = $from.node(d - 1).type.name === "list_item" && $from.index(d - 1) === 0;
  if (textblock.type.name === "paragraph" && textblock.content.size === 0 && !firstInItem) return { from: $from.before(d), to: $from.after(d) };
  return { from: $from.after(d), to: $from.after(d) };
}

/** Puts a block in, and the caret in it or after it */
function insertBlock(view: EditorView, node: Node, select: "inside" | "node" | "after") {
  const { state } = view;
  if (isInTable(state)) {
    const table = findTable(state.selection.$from);
    if (table) {
      const at = table.pos + table.node.nodeSize;
      return place(view, state.tr.insert(at, node), at, node, select);
    }
  }
  const spot = blockSpot(state);
  const tr = state.tr.replaceWith(spot.from, spot.to, node);
  return place(view, tr, spot.from, node, select);
}

function place(view: EditorView, tr: Transaction, at: number, node: Node, select: "inside" | "node" | "after") {
  if (select === "node") tr.setSelection(NodeSelection.create(tr.doc, at));
  else if (select === "inside") tr.setSelection(Selection.near(tr.doc.resolve(at + 1)));
  else {
    const after = at + node.nodeSize;
    const next = tr.doc.resolve(after).nodeAfter;
    if (!next || !next.isTextblock) tr.insert(after, view.state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, after + 1));
  }
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function insertRule(view: EditorView) {
  return insertBlock(view, view.state.schema.nodes.hr.create(), "after");
}

/** A table of `rows` rows (the first is the header) by `cols` columns, with the caret in its first cell */
export function insertTable(view: EditorView, rows: number, cols: number) {
  const { nodes } = view.state.schema;
  // No alignment of its own: the Markdown says "---", not ":---"
  const cell = (type: NodeType) => type.createAndFill({ alignment: null })!;
  const header = nodes.table_header_row.create(null, Array.from({ length: cols }, () => cell(nodes.table_header)));
  const body = Array.from({ length: Math.max(1, rows - 1) }, () => nodes.table_row.create(null, Array.from({ length: cols }, () => cell(nodes.table_cell))));
  return insertBlock(view, nodes.table.create(null, [header, ...body]), "inside");
}

/** Math: inline at the caret (taking the selected words as its source), or a block; opened for writing */
export function insertMath(view: EditorView, display: boolean) {
  const { state } = view;
  const { nodes } = state.schema;
  if (!display) {
    const { from, to, $from } = state.selection;
    if ($from.parent.type.spec.code) return false;
    const value = state.doc.textBetween(from, to, " ");
    const tr = state.tr.replaceSelectionWith(nodes.math_inline.create({ value }), false);
    view.dispatch(selectNodeNear(tr, tr.mapping.map(from, -1)));
    return true;
  }
  return insertBlock(view, nodes.math_block.create(), "node");
}

export function insertImage(view: EditorView, src: string, alt: string) {
  const { state } = view;
  const node = state.schema.nodes.image.create({ src, alt });
  if (state.selection.$from.parent.type.spec.code) return insertBlock(view, state.schema.nodes.paragraph.create(null, node), "after");
  view.dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
  return true;
}

/**
 * Changes a node's attributes (a picture's alt text, a formula's source). Attribute steps, not
 * setNodeMarkup, which replaces a leaf node outright and so loses the selection on it.
 */
export function setAttrs(view: EditorView, pos: number, attrs: Record<string, unknown>) {
  const node = view.state.doc.nodeAt(pos);
  if (!node) return false;
  const tr = view.state.tr;
  for (const [k, v] of Object.entries(attrs)) if (node.attrs[k] !== v) tr.setNodeAttribute(pos, k, v);
  if (tr.docChanged) view.dispatch(tr);
  return true;
}

export function deleteNodeAt(view: EditorView, pos: number) {
  const node = view.state.doc.nodeAt(pos);
  if (!node) return false;
  view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize).scrollIntoView());
  return true;
}

/** Leaves an atom (math) for the text beside it, and focuses the editor */
export function leaveNode(view: EditorView, pos: number, side: -1 | 1) {
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const at = side < 0 ? pos : pos + node.nodeSize;
  const tr = view.state.tr;
  if (node.isBlock) {
    const $at = tr.doc.resolve(at);
    const near = Selection.findFrom($at, side, true);
    if (near) tr.setSelection(near);
    else {
      tr.insert(at, view.state.schema.nodes.paragraph.create());
      tr.setSelection(TextSelection.create(tr.doc, at + 1));
    }
  } else tr.setSelection(TextSelection.create(tr.doc, at));
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

// ------------------------------------------------------------------------------------------
// Links

export interface LinkRange {
  from: number;
  to: number;
  href: string;
}

/** The link the caret is in (or just after), or that the selection lies inside */
export function linkAt(state: EditorState): LinkRange | null {
  const type = state.schema.marks.link;
  const { $from, from, to } = state.selection;
  if (!type || !$from.parent.inlineContent) return null;
  const parent = $from.parent;
  let found = parent.childAfter($from.parentOffset);
  if (!found.node || !type.isInSet(found.node.marks)) {
    const before = parent.childBefore($from.parentOffset);
    if (before.node && type.isInSet(before.node.marks)) found = before;
  }
  const mark = found.node && type.isInSet(found.node.marks);
  if (!found.node || !mark) return null;
  let start = found.index;
  let startPos = $from.start() + found.offset;
  let end = start + 1;
  let endPos = startPos + found.node.nodeSize;
  while (start > 0 && mark.isInSet(parent.child(start - 1).marks)) {
    start--;
    startPos -= parent.child(start).nodeSize;
  }
  while (end < parent.childCount && mark.isInSet(parent.child(end).marks)) {
    endPos += parent.child(end).nodeSize;
    end++;
  }
  if (to > endPos || from < startPos) return null;
  return { from: startPos, to: endPos, href: String(mark.attrs.href ?? "") };
}

/** Links the selection, or puts in linked words at the caret, or changes the link at `range` */
export function applyLink(view: EditorView, href: string, text: string, range: LinkRange | null) {
  const { state } = view;
  const type = state.schema.marks.link;
  const mark = type.create({ href });
  const tr = state.tr;
  if (range) {
    const current = state.doc.textBetween(range.from, range.to);
    if (text && text !== current) tr.replaceWith(range.from, range.to, state.schema.text(text, [...state.doc.resolve(range.from + 1).marks().filter((m) => m.type !== type), mark]));
    else tr.removeMark(range.from, range.to, type).addMark(range.from, range.to, mark);
    const end = range.from + (text && text !== current ? text.length : range.to - range.from);
    tr.setSelection(TextSelection.create(tr.doc, end));
  } else if (state.selection.empty) {
    const words = text || href.replace(/^mailto:/, "");
    const at = state.selection.from;
    tr.insert(at, state.schema.text(words, [...(state.storedMarks ?? state.selection.$from.marks()), mark]));
    tr.setSelection(TextSelection.create(tr.doc, at + words.length));
  } else {
    tr.addMark(state.selection.from, state.selection.to, mark);
  }
  tr.removeStoredMark(type);
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function removeLink(view: EditorView, range: LinkRange) {
  view.dispatch(view.state.tr.removeMark(range.from, range.to, view.state.schema.marks.link));
  return true;
}

// ------------------------------------------------------------------------------------------
// Tables

export type Align = "left" | "center" | "right";

export function tableAt(state: EditorState): { pos: number; node: Node } | null {
  if (!isInTable(state)) return null;
  const t = findTable(state.selection.$from);
  return t ? { pos: t.pos, node: t.node } : null;
}

export const addRow = (where: "above" | "below") => run(where === "above" ? addRowBefore : addRowAfter);
export const addColumn = (where: "left" | "right") => run(where === "left" ? addColumnBefore : addColumnAfter);

/** Deletes the row the caret is in; the header row can't go, so there it clears nothing and says no */
export function removeRow(view: EditorView) {
  if (!isInTable(view.state)) return false;
  const rect = selectedRect(view.state);
  if (rect.top === 0) return false;
  if (rect.map.height - (rect.bottom - rect.top) < 2) return run(deleteTable)(view);
  return run(deleteRow)(view);
}

export function removeColumn(view: EditorView) {
  if (!isInTable(view.state)) return false;
  const rect = selectedRect(view.state);
  if (rect.map.width - (rect.right - rect.left) < 1) return run(deleteTable)(view);
  return run(deleteColumn)(view);
}

export const removeTable = run(deleteTable);

/** The alignment of the column the caret is in */
export function columnAlign(state: EditorState): Align | null {
  if (!isInTable(state)) return null;
  const rect = selectedRect(state);
  const pos = rect.map.map[rect.left];
  const cell = rect.table.nodeAt(pos);
  return (cell?.attrs.alignment as Align) ?? "left";
}

/** Aligns whole columns (Markdown aligns a column, not a cell) */
export function setColumnAlign(view: EditorView, align: Align) {
  const { state } = view;
  if (!isInTable(state)) return false;
  const rect = selectedRect(state);
  const tr = state.tr;
  for (let col = rect.left; col < rect.right; col++) {
    for (const cellPos of rect.map.cellsInRect({ left: col, right: col + 1, top: 0, bottom: rect.map.height })) {
      const pos = rect.tableStart + cellPos;
      const cell = tr.doc.nodeAt(pos);
      if (cell && cell.attrs.alignment !== align) tr.setNodeMarkup(pos, undefined, { ...cell.attrs, alignment: align });
    }
  }
  view.dispatch(tr);
  return true;
}

/** Tab in the last cell adds a row, as in a spreadsheet */
export function tabInTable(view: EditorView, back: boolean) {
  const { state } = view;
  if (!isInTable(state) || back) return false;
  const rect = selectedRect(state);
  const map: TableMap = rect.map;
  if (rect.bottom === map.height && rect.right === map.width) {
    addRowAfter(state, (tr) => {
      const table = tr.doc.nodeAt(rect.tableStart - 1);
      if (!table) return;
      const m = TableMap.get(table);
      const first = rect.tableStart + m.map[(m.height - 1) * m.width];
      view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(first + 1))).scrollIntoView());
    });
    return true;
  }
  return false;
}

// ------------------------------------------------------------------------------------------
// Blocks: what the block handle and its menu act on

export interface BlockAt {
  pos: number;
  node: Node;
}

/** The block the caret is in, for the keyboard: the list item in a list, else the top-level block */
export function blockAt(state: EditorState): BlockAt | null {
  const { $from } = state.selection;
  if (state.selection instanceof NodeSelection && state.selection.$from.depth === 0) return { pos: state.selection.from, node: state.selection.node };
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "list_item" || d === 1) return { pos: $from.before(d), node };
  }
  return null;
}

/** The block plugin-block found under the pointer, still there in the current document */
export function blockFromActive(state: EditorState, active: ActiveNode): BlockAt | null {
  const pos = active.$pos.pos;
  if (pos > state.doc.content.size) return null;
  const node = state.doc.nodeAt(pos);
  return node && node.type === active.node.type ? { pos, node } : null;
}

/** Moves a block past its neighbour, keeping the caret in it */
export function moveBlock(view: EditorView, dir: -1 | 1, at = blockAt(view.state)) {
  if (!at) return false;
  const $pos = view.state.doc.resolve(at.pos);
  const index = $pos.index();
  if (dir < 0 ? index === 0 : index === $pos.parent.childCount - 1) return false;
  const other = $pos.parent.child(index + dir);
  return moveBlockTo(view, at, dir < 0 ? at.pos - other.nodeSize : at.pos + at.node.nodeSize + other.nodeSize);
}

/**
 * Moves a block to `to`, a position between two of its siblings in the current document, as one
 * undo step. The selection goes with it: the block stays selected if it was, the caret stays where
 * it was in it, and otherwise the caret goes to its start.
 */
export function moveBlockTo(view: EditorView, at: BlockAt, to: number) {
  const { state } = view;
  const end = at.pos + at.node.nodeSize;
  if (to === at.pos || to === end || state.doc.nodeAt(at.pos) !== at.node) return false;
  const { selection } = state;
  const whole = selection instanceof NodeSelection && selection.from === at.pos;
  const inside = selection.from > at.pos && selection.to < end;
  const offset = inside ? selection.from - at.pos : 1;
  const tr = state.tr.delete(at.pos, end);
  const pos = tr.mapping.map(to);
  tr.insert(pos, at.node);
  if (whole || at.node.isAtom) tr.setSelection(NodeSelection.create(tr.doc, pos));
  else tr.setSelection(Selection.near(tr.doc.resolve(Math.min(pos + offset, pos + at.node.nodeSize - 1))));
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function duplicateBlock(view: EditorView, at = blockAt(view.state)) {
  if (!at) return false;
  const after = at.pos + at.node.nodeSize;
  const tr = view.state.tr.insert(after, at.node);
  tr.setSelection(Selection.near(tr.doc.resolve(after + 1)));
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function deleteBlock(view: EditorView, at = blockAt(view.state)) {
  if (!at) return false;
  const { state } = view;
  const tr = state.tr;
  if (state.doc.childCount === 1 && at.pos === 0) tr.replaceWith(0, at.node.nodeSize, state.schema.nodes.paragraph.create());
  else tr.delete(at.pos, at.pos + at.node.nodeSize);
  const near = Selection.near(tr.doc.resolve(Math.min(at.pos, tr.doc.content.size)));
  view.dispatch(tr.setSelection(near).scrollIntoView());
  return true;
}

export type TurnInto = BlockKind | ListKind | "quote";

/** Turns a block into another kind, from the handle's menu */
export function turnInto(view: EditorView, at: BlockAt, kind: TurnInto) {
  const inner = Selection.findFrom(view.state.doc.resolve(at.pos + 1), 1, true) ?? Selection.near(view.state.doc.resolve(at.pos));
  view.dispatch(view.state.tr.setSelection(inner));
  if (kind === "quote") return toggleQuote(view);
  if (kind === "ul" || kind === "ol" || kind === "task") return toggleList(view, kind);
  if (kind === "pre") return toggleCodeBlock(view, true);
  return setTextStyle(view, kind);
}

/**
 * Starts a drag of a block from the handle, in its dragstart. The editor takes the drop itself
 * (`blockDropAt`, `moveBlockTo`), wherever in it the pointer is, so ProseMirror's own drop isn't
 * involved. Firefox only starts a drag that has data; the data also lets the block be dropped as
 * text into other places.
 */
export function dragBlock(view: EditorView, at: BlockAt, e: DragEvent, image: Element | null) {
  const { dom, text } = view.serializeForClipboard(NodeSelection.create(view.state.doc, at.pos).content());
  if (e.dataTransfer) {
    e.dataTransfer.clearData();
    e.dataTransfer.setData("text/html", dom.innerHTML);
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.effectAllowed = "copyMove";
    if (image) e.dataTransfer.setDragImage(image, 0, 0);
  }
  // The block is selected to show what is moving, but only after dragstart: Chrome and Safari drop
  // a drag whose handle isn't under the pointer when dragstart ends, and the selection changes the
  // toolbar, which can move the text and the handle with it.
  window.setTimeout(() => {
    if (view.isDestroyed || view.state.doc.nodeAt(at.pos) !== at.node) return;
    if (NodeSelection.isSelectable(at.node)) view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, at.pos)));
  });
}

/** Where a dragged block would go, and the line that shows it (client coordinates) */
export interface BlockDrop {
  /** The position between two siblings, in the current document */
  pos: number;
  y: number;
  left: number;
  width: number;
  /** Dropping here leaves the block where it is */
  still: boolean;
}

/**
 * Where a block being dragged would go with the pointer at `y`: the gap among its siblings (the
 * other top-level blocks, or the other items of its list) nearest to it. Only the height counts,
 * so the pointer can be anywhere beside the text, in the margin the handle is in or past either
 * end. The empty paragraph kept at the end of the document stays last.
 */
export function blockDropAt(view: EditorView, at: BlockAt, y: number): BlockDrop | null {
  const { doc } = view.state;
  if (doc.nodeAt(at.pos) !== at.node) return null;
  const $pos = doc.resolve(at.pos);
  const parent = $pos.parent;
  const index = $pos.index();
  const rows: { pos: number; rect: DOMRect }[] = [];
  let pos = $pos.start();
  for (let i = 0; i < parent.childCount; i++) {
    const el = view.nodeDOM(pos);
    if (!(el instanceof HTMLElement)) return null;
    rows.push({ pos, rect: el.getBoundingClientRect() });
    pos += parent.child(i).nodeSize;
  }
  const n = rows.length;
  if (!n) return null;
  const last = parent.lastChild;
  const trailing = $pos.depth === 0 && index !== n - 1 && last?.type.name === "paragraph" && last.content.size === 0 ? 1 : 0;
  let gap = rows.filter((r) => r.rect.top + r.rect.height / 2 < y).length;
  gap = Math.min(gap, n - trailing);
  const above = rows[gap - 1]?.rect;
  const below = rows[gap]?.rect;
  const line = above && below ? (above.bottom + below.top) / 2 : above ? above.bottom + 2 : below ? below.top - 2 : y;
  const left = Math.min(...rows.map((r) => r.rect.left));
  const width = Math.max(...rows.map((r) => r.rect.right)) - left;
  return { pos: gap < n ? rows[gap].pos : pos, y: line, left, width, still: gap === index || gap === index + 1 };
}

// ------------------------------------------------------------------------------------------
// Keys that change the text (the editor's own UI keys are handled before these)

const isMod = (e: KeyboardEvent) => (navigator.platform.includes("Mac") || /iPhone|iPad/.test(navigator.userAgent) ? e.metaKey : e.ctrlKey);

/** Typing shortcuts beyond the presets', by physical key so they work on any layout */
export function editingKeys(view: EditorView, e: KeyboardEvent): boolean {
  const mod = isMod(e);
  // Returning true has ProseMirror prevent the browser's default, whether the command applied or not
  const handled = (command: () => unknown) => {
    command();
    return true;
  };
  if (mod && e.shiftKey && !e.altKey) {
    if (e.code === "KeyX") return handled(() => toggleMarkCommand("strike_through")(view));
    if (e.code === "Digit7") return handled(() => toggleList(view, "ol"));
    if (e.code === "Digit8") return handled(() => toggleList(view, "ul"));
    if (e.code === "Digit9") return handled(() => toggleList(view, "task"));
  }
  if (mod && e.altKey && !e.shiftKey && !e.getModifierState("AltGraph") && /^Digit[0-6]$/.test(e.code)) {
    const n = Number(e.code.slice(5));
    return handled(() => setTextStyle(view, n === 0 ? "p" : (`h${n}` as BlockKind)));
  }
  if (mod && !e.shiftKey && !e.altKey && e.key === "Enter" && !isInTable(view.state)) return toggleTask(view);
  if (e.altKey && e.shiftKey && !mod && (e.key === "ArrowUp" || e.key === "ArrowDown")) return handled(() => moveBlock(view, e.key === "ArrowUp" ? -1 : 1));
  if (mod || e.altKey) return false;

  const { state } = view;
  const { $from, empty } = state.selection;
  const inCode = $from.parent.type.spec.code;
  if (e.key === "Tab") {
    if (inCode && !e.shiftKey) {
      view.dispatch(state.tr.insertText("  "));
      return true;
    }
    if (isInTable(state)) return tabInTable(view, e.shiftKey);
    return false;
  }
  if (e.key === "Enter" && !e.shiftKey && empty && !inCode && $from.parent.type.name === "paragraph" && $from.parentOffset === $from.parent.content.size) {
    const text = $from.parent.textContent;
    const fence = /^```([\w+#.-]*)\s*$/.exec(text);
    if (fence) {
      const tr = state.tr.replaceRangeWith($from.before(), $from.after(), state.schema.nodes.code_block.create({ language: fence[1] }));
      tr.setSelection(TextSelection.create(tr.doc, $from.before() + 1));
      view.dispatch(tr.scrollIntoView());
      return true;
    }
    if (/^\$\$\s*$/.test(text) && $from.depth === 1) {
      const tr = state.tr.replaceRangeWith($from.before(), $from.after(), state.schema.nodes.math_block.create());
      view.dispatch(selectNodeNear(tr, $from.before()));
      return true;
    }
  }
  // Enter on an empty last line of a code block leaves it, as in the first editor
  if (e.key === "Enter" && !e.shiftKey && empty && inCode && $from.parentOffset === $from.parent.content.size && $from.parent.textContent.endsWith("\n")) {
    const tr = state.tr.delete($from.pos - 1, $from.pos);
    const after = tr.mapping.map($from.after());
    tr.insert(after, state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, after + 1));
    view.dispatch(tr.scrollIntoView());
    return true;
  }
  return false;
}

/** The "/query" typed at the start of an otherwise empty paragraph, for the slash menu */
export function slashAt(state: EditorState): { from: number; to: number; query: string } | null {
  const { selection } = state;
  if (!(selection instanceof TextSelection) || !selection.empty) return null;
  const { $from } = selection;
  if ($from.parent.type.name !== "paragraph" || $from.parent.type.spec.code) return null;
  if (ancestor($from, "table")) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
  const m = /^\/([^\s/￼]{0,24})$/.exec(before);
  if (!m || $from.parentOffset !== $from.parent.content.size) return null;
  return { from: $from.start(), to: $from.pos, query: m[1] };
}

/** Takes out the typed "/query" before running the chosen block command */
export function clearSlash(view: EditorView, at: { from: number; to: number }) {
  view.dispatch(view.state.tr.delete(at.from, at.to));
}
