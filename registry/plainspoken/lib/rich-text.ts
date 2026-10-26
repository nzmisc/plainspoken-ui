/*
 * The editing half of the rich text editor: what it does to the DOM of its contenteditable area.
 * The area's HTML is always Markdown's subset (see lib/markdown.ts, which writes it and reads it
 * back): paragraphs, h1–h6, lists whose task items start with a checkbox in a
 * contenteditable="false" island, blockquotes, pre > code ending in a line end, hr, tables, and
 * inside them strong/b, em/i, s/del/strike, code, a, img and br.
 *
 * Block and list changes are done here on the DOM, not with document.execCommand, whose
 * formatBlock, insertList and indent differ between browsers and make markup Markdown has no
 * words for. The editor still uses execCommand for bold, italic, strikethrough, createLink and
 * inserting pasted blocks, where the browsers agree and splitting text across marks is hard.
 */

export type BlockKind = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "pre";
export type ListKind = "ul" | "ol" | "task";

const TEXT_BLOCK = /^(P|H[1-6]|PRE|LI|TD|TH)$/;
const BLOCK =
  /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|HR|TABLE|THEAD|TBODY|TFOOT|TR|TD|TH|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|FIGURE|FIGCAPTION|ADDRESS|DL|DT|DD|DETAILS|SUMMARY|FORM|FIELDSET|CENTER)$/;
const BLOCK_KEEP = /^(P|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|HR|TABLE|THEAD|TBODY|TR|TH|TD)$/;
const INLINE_KEEP = /^(STRONG|B|EM|I|S|DEL|STRIKE|CODE|A|IMG|BR)$/;
const DROP = /^(SCRIPT|STYLE|META|LINK|TITLE|IFRAME|OBJECT|EMBED|TEMPLATE|NOSCRIPT|SVG|MATH|VIDEO|AUDIO|CANVAS|BUTTON|SELECT|TEXTAREA|INPUT|HEAD|FORM)$/i;
const KEEP_ATTRS: Record<string, string[]> = {
  A: ["href", "title"],
  IMG: ["src", "alt", "title", "data-src", "data-uploading", "data-selected"],
  PRE: ["data-lang"],
  CODE: ["class"],
  OL: ["start", "class"],
  UL: ["class"],
  LI: ["class", "data-checked"],
  TH: ["align"],
  TD: ["align"],
};

const isEl = (n: Node | null | undefined): n is HTMLElement => !!n && n.nodeType === 1;
const isList = (n: Node | null | undefined): n is HTMLElement => isEl(n) && (n.tagName === "UL" || n.tagName === "OL");
/** The checkbox island at the start of a task item */
export const isTaskBox = (n: Node | null | undefined): boolean => isEl(n) && n.hasAttribute("data-task");

/** The nearest element from `node` up to (not including) `root` whose tag matches */
export function closestIn(node: Node | null, tags: RegExp, root: HTMLElement): HTMLElement | null {
  for (let n = isEl(node) ? node : (node?.parentElement ?? null); n && n !== root; n = n.parentElement) if (tags.test(n.tagName)) return n;
  return null;
}

/** The text block (p, heading, pre, list item, cell) a point is in */
export const leafOf = (node: Node | null, root: HTMLElement) => closestIn(node, TEXT_BLOCK, root);

/** The selection's range, if it is inside `root` */
export function rangeIn(root: HTMLElement | null): Range | null {
  if (!root) return null;
  const sel = root.ownerDocument.getSelection();
  if (!sel?.rangeCount) return null;
  const r = sel.getRangeAt(0);
  return root.contains(r.startContainer) && root.contains(r.endContainer) ? r : null;
}

export function setCaret(node: Node, offset: number) {
  const max = node.nodeType === 3 ? (node.nodeValue ?? "").length : node.childNodes.length;
  node.ownerDocument?.getSelection()?.setBaseAndExtent(node, Math.min(offset, max), node, Math.min(offset, max));
}

/** A caret just after `node` */
export function caretAfter(node: Node) {
  const parent = node.parentNode;
  if (parent) setCaret(parent, Array.prototype.indexOf.call(parent.childNodes, node) + 1);
}

export function emptyParagraph(doc: Document): HTMLElement {
  const p = doc.createElement("p");
  p.append(doc.createElement("br"));
  return p;
}

/** A block's own inline content: not its nested lists or blocks, nor a task checkbox */
const ownNodes = (el: HTMLElement) => [...el.childNodes].filter((n) => !(isEl(n) && BLOCK.test(n.tagName)) && !isTaskBox(n));

/** No words and no picture (a <br> doesn't count) */
export function isEmptyBlock(el: HTMLElement): boolean {
  const own = el.tagName === "LI" ? ownNodes(el) : [...el.childNodes];
  return own.every((n) => (n.nodeType === 3 ? !(n.nodeValue ?? "").replace(/​/g, "").trim() : isEl(n) && n.tagName === "BR"));
}

/** The text from the start of `leaf` to the start of `range`; a picture in it shows as U+FFFC */
export function textBefore(leaf: HTMLElement, range: Range): string {
  const r = leaf.ownerDocument.createRange();
  r.setStart(leaf, 0);
  r.setEnd(range.startContainer, range.startOffset);
  const f = r.cloneContents();
  return (f.querySelector("img") ? "￼" : "") + (f.textContent ?? "").replace(/​/g, "");
}

/** The text from the end of `range` to the end of `leaf`'s own content */
export function textAfter(leaf: HTMLElement, range: Range): string {
  const r = leaf.ownerDocument.createRange();
  r.setStart(range.endContainer, range.endOffset);
  const own = ownNodes(leaf);
  const last = leaf.tagName === "LI" ? own[own.length - 1] : leaf.lastChild;
  // An end before the start collapses the range there: nothing after
  if (last) r.setEndAfter(last);
  else r.setEnd(leaf, leaf.childNodes.length);
  const f = r.cloneContents();
  return (f.querySelector("img") ? "￼" : "") + (f.textContent ?? "").replace(/[​\n]/g, "");
}

/**
 * The text blocks a range touches: paragraphs, headings, code blocks, and list items that hold
 * their text themselves (a loose item's paragraphs count instead). A list item doesn't count when
 * the range is inside one of its nested lists only.
 */
export function textBlocks(root: HTMLElement, range: Range): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6,pre,li")].filter((el) => {
    if (!range.intersectsNode(el) || el.closest("td,th")) return false;
    if (el.tagName !== "LI") return true;
    if (!ownNodes(el).length && el.querySelector(":scope > :is(p,h1,h2,h3,h4,h5,h6,pre,blockquote)")) return false;
    return ![...el.children].some((c) => isList(c) && c.contains(range.startContainer) && c.contains(range.endContainer));
  });
}

// ---------------------------------------------------------------------------------------------
// Keeping the selection while the DOM changes

/** Characters before a point: text, plus one for each text block's start and each <br>, <img>, <hr> */
function textOffset(root: HTMLElement, node: Node, offset: number): number {
  let count = 0;
  let done = false;
  const visit = (n: Node) => {
    if (done) return;
    if (n.nodeType === 3) {
      if (n === node) {
        count += offset;
        done = true;
      } else count += (n.nodeValue ?? "").length;
      return;
    }
    if (!isEl(n) || isTaskBox(n)) return;
    if (n !== root && (TEXT_BLOCK.test(n.tagName) || /^(BR|IMG|HR)$/.test(n.tagName))) count++;
    const kids = n.childNodes;
    for (let i = 0; i < kids.length && !done; i++) {
      if (n === node && i === offset) {
        done = true;
        return;
      }
      visit(kids[i]);
    }
    if (n === node) done = true;
  };
  visit(root);
  return count;
}

/** The point `target` characters in (counted as textOffset does) */
function pointAt(root: HTMLElement, target: number): { node: Node; offset: number } {
  let count = 0;
  let found: { node: Node; offset: number } | null = null;
  const visit = (n: Node) => {
    const kids = n.childNodes;
    for (let i = 0; i < kids.length && !found; i++) {
      const c = kids[i];
      if (c.nodeType === 3) {
        const len = (c.nodeValue ?? "").length;
        if (count + len >= target) found = { node: c, offset: target - count };
        else count += len;
      } else if (isEl(c) && !isTaskBox(c)) {
        if (/^(BR|IMG|HR)$/.test(c.tagName)) {
          if (count >= target) found = { node: n, offset: i };
          else count++;
        } else {
          if (TEXT_BLOCK.test(c.tagName)) count++;
          visit(c);
          if (!found && TEXT_BLOCK.test(c.tagName) && count >= target) found = { node: c, offset: c.childNodes.length };
        }
      }
    }
  };
  visit(root);
  return found ?? { node: root, offset: root.childNodes.length };
}

/**
 * Runs a DOM change and puts the selection back where it was. Moved nodes take the selection
 * with them only in theory (removing a node collapses a range inside it), so the points are put
 * back by node when those nodes survive, else by their position in the text. `change` returns
 * false when it changed nothing (the selection is left alone, which keeps a pending bold), or
 * "caret" when it placed the caret itself.
 */
export function withSelection(root: HTMLElement, change: () => boolean | "caret"): boolean {
  const sel = root.ownerDocument.getSelection();
  const inside = !!sel?.rangeCount && root.contains(sel.anchorNode) && root.contains(sel.focusNode);
  if (!inside || !sel) return change() !== false;
  const a = { node: sel.anchorNode!, offset: sel.anchorOffset };
  const f = { node: sel.focusNode!, offset: sel.focusOffset };
  const ta = textOffset(root, a.node, a.offset);
  const tf = textOffset(root, f.node, f.offset);
  const result = change();
  if (result === false) return false;
  if (result === "caret") return true;
  const alive = (p: { node: Node; offset: number }) =>
    root.contains(p.node) && p.offset <= (p.node.nodeType === 3 ? (p.node.nodeValue ?? "").length : p.node.childNodes.length);
  try {
    if (alive(a) && alive(f)) sel.setBaseAndExtent(a.node, a.offset, f.node, f.offset);
    else {
      const pa = pointAt(root, ta);
      const pf = pointAt(root, tf);
      sel.setBaseAndExtent(pa.node, pa.offset, pf.node, pf.offset);
    }
  } catch {
    // A point that can't take a caret: leave the browser's choice
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Undo snapshots

export interface Snapshot {
  html: string;
  /** The same HTML, one string per top-level block, for rebasing on a change made elsewhere */
  blocks: string[];
  selection: { anchor: number[]; anchorOffset: number; focus: number[]; focusOffset: number } | null;
}

function pathTo(root: Node, node: Node): number[] {
  const path: number[] = [];
  for (let n: Node | null = node; n && n !== root; n = n.parentNode) path.unshift(Array.prototype.indexOf.call(n.parentNode?.childNodes ?? [], n));
  return path;
}

function nodeAt(root: Node, path: number[]): Node | null {
  let n: Node | null = root;
  for (const i of path) n = n?.childNodes[i] ?? null;
  return n;
}

/** The area's HTML (without passing marks such as the selected picture's outline) and where the selection is */
export function takeSnapshot(root: HTMLElement): Snapshot {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-selected]").forEach((e) => e.removeAttribute("data-selected"));
  const sel = root.ownerDocument.getSelection();
  const inside = !!sel?.rangeCount && root.contains(sel.anchorNode) && root.contains(sel.focusNode);
  return {
    html: clone.innerHTML,
    blocks: [...clone.children].map((c) => c.outerHTML),
    selection:
      inside && sel
        ? { anchor: pathTo(root, sel.anchorNode!), anchorOffset: sel.anchorOffset, focus: pathTo(root, sel.focusNode!), focusOffset: sel.focusOffset }
        : null,
  };
}

/** Puts a snapshot back. Without a selection of its own it takes `fallback` (the undone step's), as near as it fits. */
export function restoreSnapshot(root: HTMLElement, snap: Snapshot, fallback?: Snapshot["selection"]) {
  root.innerHTML = snap.html;
  const s = snap.selection ?? fallback ?? null;
  const a = s && nodeAt(root, s.anchor);
  const f = s && nodeAt(root, s.focus);
  const fit = (n: Node, o: number) => Math.min(o, n.nodeType === 3 ? (n.nodeValue ?? "").length : n.childNodes.length);
  try {
    if (s && a && f) root.ownerDocument.getSelection()?.setBaseAndExtent(a, fit(a, s.anchorOffset), f, fit(f, s.focusOffset));
  } catch {
    // The old point no longer fits; the caret stays where the browser puts it
  }
}

// ---------------------------------------------------------------------------------------------
// Normalizing: whatever the browser or a drop made, back to the Markdown subset

function codeTextOf(n: Node): string {
  let s = "";
  for (const c of n.childNodes) {
    if (c.nodeType === 3) s += c.nodeValue ?? "";
    else if (isEl(c)) s += c.tagName === "BR" ? "\n" : (c.tagName === "DIV" || c.tagName === "P") && s && !s.endsWith("\n") ? "\n" + codeTextOf(c) : codeTextOf(c);
  }
  return s;
}

function fixPre(pre: HTMLElement): boolean {
  let changed = false;
  let code = pre.firstElementChild as HTMLElement | null;
  const plain = pre.childNodes.length === 1 && code?.tagName === "CODE" && [...code.childNodes].every((n) => n.nodeType === 3);
  if (!plain) {
    const text = codeTextOf(pre);
    code = pre.ownerDocument.createElement("code");
    code.textContent = text;
    pre.replaceChildren(code);
    changed = true;
  }
  if (!(code!.textContent ?? "").endsWith("\n")) {
    const last = code!.lastChild;
    if (last?.nodeType === 3) (last as Text).appendData("\n");
    else code!.append("\n");
    changed = true;
  }
  return changed;
}

function fixTaskClass(list: HTMLElement) {
  const any = [...list.children].some((li) => li.querySelector(":scope > [data-task]"));
  if (any !== list.classList.contains("contains-task-list")) list.classList.toggle("contains-task-list", any);
  if (list.getAttribute("class") === "") list.removeAttribute("class");
}

function fixItem(li: HTMLElement): boolean {
  let changed = false;
  for (const c of [...li.children] as HTMLElement[]) {
    const t = c.tagName;
    if (t === "UL" || t === "OL") changed = fixList(c) || changed;
    else if (t === "BLOCKQUOTE") changed = structure(c) || changed;
    else if (t === "PRE") changed = fixPre(c) || changed;
  }
  const box = li.querySelector<HTMLElement>(":scope > [data-task]");
  if (box && li.firstChild !== box) {
    li.prepend(box);
    changed = true;
  }
  const task = !!box;
  if (task !== li.classList.contains("task-list-item")) {
    li.classList.toggle("task-list-item", task);
    changed = true;
  }
  if (!task && li.hasAttribute("data-checked")) li.removeAttribute("data-checked");
  if (li.getAttribute("class") === "") li.removeAttribute("class");
  if (!li.childNodes.length || (box && li.childNodes.length === 1)) {
    li.append(li.ownerDocument.createElement("br"));
    changed = true;
  }
  return changed;
}

function fixList(list: HTMLElement): boolean {
  let changed = false;
  for (const c of [...list.childNodes]) {
    if (isEl(c) && c.tagName === "LI") {
      changed = fixItem(c) || changed;
      continue;
    }
    if (c.nodeType === 3 && !/\S/.test(c.nodeValue ?? "")) {
      c.remove();
      changed = true;
      continue;
    }
    // Anything else in a list (a nested list from indenting, stray text) belongs to the item before it
    let prev = c.previousSibling;
    while (prev && !(isEl(prev) && prev.tagName === "LI")) prev = prev.previousSibling;
    let li = prev as HTMLElement | null;
    if (!li) {
      li = list.ownerDocument.createElement("li");
      list.insertBefore(li, c);
    }
    li.append(c);
    if (isList(c)) fixList(c);
    changed = true;
  }
  if (!list.children.length) {
    list.remove();
    return true;
  }
  fixTaskClass(list);
  return changed;
}

/** Paragraphs for loose inline content, the structure of nested containers, nothing between blocks */
function structure(container: HTMLElement): boolean {
  const doc = container.ownerDocument;
  let changed = false;
  // A paragraph or heading with a block inside (an <hr> or a list pasted into it) is taken apart
  for (const c of [...container.children])
    if (/^(P|H[1-6])$/.test(c.tagName) && c.querySelector("p,div,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote,pre,hr,table")) {
      c.replaceWith(...c.childNodes);
      changed = true;
    }
  let run: Node[] = [];
  const flush = () => {
    if (!run.length) return;
    if (run.some((n) => n.nodeType !== 3 || /\S/.test(n.nodeValue ?? ""))) {
      const p = doc.createElement("p");
      run[0].parentNode!.insertBefore(p, run[0]);
      p.append(...run);
    } else for (const n of run) n.parentNode?.removeChild(n);
    changed = true;
    run = [];
  };
  for (const c of [...container.childNodes]) {
    if (!isEl(c) || !BLOCK_KEEP.test(c.tagName)) {
      if (c.nodeType === 3 || isEl(c)) run.push(c);
      else {
        c.parentNode?.removeChild(c);
        changed = true;
      }
      continue;
    }
    flush();
    switch (c.tagName) {
      case "BLOCKQUOTE":
        changed = structure(c) || changed;
        if (!c.childNodes.length) {
          c.append(emptyParagraph(doc));
          changed = true;
        }
        break;
      case "UL":
      case "OL":
        changed = fixList(c) || changed;
        break;
      case "LI": {
        const prev = c.previousElementSibling;
        if (prev?.tagName === "UL") prev.append(c);
        else {
          const ul = doc.createElement("ul");
          c.before(ul);
          ul.append(c);
        }
        changed = true;
        break;
      }
      case "PRE":
        changed = fixPre(c) || changed;
        break;
      case "TABLE":
      case "TR":
      case "TH":
      case "TD":
      case "THEAD":
      case "TBODY":
        break;
      default:
        if (!c.childNodes.length || (c.childNodes.length === 1 && c.firstChild!.nodeType === 3 && !c.firstChild!.nodeValue)) {
          c.replaceChildren(doc.createElement("br"));
          changed = true;
        }
    }
  }
  flush();
  return changed;
}

/**
 * Brings the area back to the Markdown subset after the browser has edited it: unknown elements
 * unwrapped (span, font, u…), dangerous ones removed, attributes not in the subset dropped, divs
 * made paragraphs, stray text put in paragraphs, nested lists put inside their items, code blocks
 * made plain text with a final line end, and a paragraph after a last rule or table so the caret
 * can get below it. Returns whether anything changed.
 */
export function normalize(root: HTMLElement): boolean {
  const doc = root.ownerDocument;
  let changed = false;
  const clean = (el: HTMLElement) => {
    for (const c of [...el.childNodes]) {
      if (c.nodeType === 8) {
        c.remove();
        changed = true;
        continue;
      }
      if (!isEl(c)) continue;
      if (isTaskBox(c)) {
        if (el.tagName !== "LI") {
          c.remove();
          changed = true;
        }
        continue;
      }
      const t = c.tagName;
      if (DROP.test(t)) {
        c.remove();
        changed = true;
        continue;
      }
      clean(c);
      if (!INLINE_KEEP.test(t) && !BLOCK_KEEP.test(t)) {
        if (BLOCK.test(t) && !c.querySelector("p,div,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote,pre,hr,table")) {
          const p = doc.createElement("p");
          p.append(...c.childNodes);
          c.replaceWith(p);
        } else c.replaceWith(...c.childNodes);
        changed = true;
        continue;
      }
      const keep = KEEP_ATTRS[t] ?? [];
      for (const a of [...c.attributes])
        if (!keep.includes(a.name)) {
          c.removeAttribute(a.name);
          changed = true;
        }
    }
  };
  clean(root);
  changed = structure(root) || changed;
  const last = root.lastElementChild;
  if (!last || /^(HR|TABLE)$/.test(last.tagName)) {
    root.append(emptyParagraph(doc));
    changed = true;
  }
  return changed;
}

/** No words, pictures, rules or code: show the placeholder */
export function isEmptyDoc(root: HTMLElement): boolean {
  return !(root.textContent ?? "").replace(/​/g, "").trim() && !root.querySelector("img,hr,pre,table,li,blockquote");
}

// ---------------------------------------------------------------------------------------------
// What the selection is in

export interface SelectionFormats {
  block: BlockKind;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  link: HTMLAnchorElement | null;
  list: ListKind | null;
  quote: boolean;
  /** A picture selected on its own */
  image: HTMLImageElement | null;
  pre: HTMLElement | null;
  table: boolean;
}

export function listKind(li: HTMLElement): ListKind {
  return li.parentElement?.tagName === "OL" ? "ol" : li.querySelector(":scope > [data-task]") ? "task" : "ul";
}

export function selectedImage(range: Range): HTMLImageElement | null {
  if (range.startContainer !== range.endContainer || range.endOffset - range.startOffset !== 1) return null;
  const n = range.startContainer.childNodes[range.startOffset];
  return isEl(n) && n.tagName === "IMG" ? (n as HTMLImageElement) : null;
}

export function readFormats(root: HTMLElement, range: Range): SelectionFormats {
  const f: SelectionFormats = { block: "p", bold: false, italic: false, strike: false, code: false, link: null, list: null, quote: false, image: selectedImage(range), pre: null, table: false };
  let blockFound = false;
  for (let el = isEl(range.startContainer) ? range.startContainer : range.startContainer.parentElement; el && el !== root; el = el.parentElement) {
    const t = el.tagName;
    if (t === "B" || t === "STRONG") f.bold = true;
    else if (t === "I" || t === "EM") f.italic = true;
    else if (t === "S" || t === "DEL" || t === "STRIKE") f.strike = true;
    else if (t === "A") f.link ??= el as HTMLAnchorElement;
    else if (t === "CODE" && !el.closest("pre")) f.code = true;
    else if (t === "PRE") {
      f.pre = el;
      if (!blockFound) f.block = "pre";
      blockFound = true;
    } else if (/^H[1-6]$/.test(t)) {
      if (!blockFound) f.block = t.toLowerCase() as BlockKind;
      blockFound = true;
    } else if (t === "P") blockFound = true;
    else if (t === "LI") {
      f.list ??= listKind(el);
      blockFound = true;
    } else if (t === "BLOCKQUOTE") f.quote = true;
    else if (t === "TD" || t === "TH") f.table = true;
  }
  return f;
}

// ---------------------------------------------------------------------------------------------
// Block changes

function retag(el: HTMLElement, tag: string): HTMLElement {
  const n = el.ownerDocument.createElement(tag);
  for (const a of ["class", "start"]) {
    const v = el.getAttribute(a);
    if (v != null) n.setAttribute(a, v);
  }
  n.append(...el.childNodes);
  el.replaceWith(n);
  return n;
}

/** One block per line of a code block's text */
function preToBlocks(pre: HTMLElement, tag: string): HTMLElement[] {
  const doc = pre.ownerDocument;
  const lines = (pre.textContent ?? "").replace(/\n$/, "").split("\n");
  const blocks = lines.map((line) => {
    const b = doc.createElement(tag);
    if (line) b.textContent = line;
    else b.append(doc.createElement("br"));
    return b;
  });
  pre.replaceWith(...blocks);
  return blocks;
}

/** Paragraph or heading for each text block in the range. A list item's text becomes a heading inside it. */
export function setBlockType(root: HTMLElement, range: Range, kind: Exclude<BlockKind, "pre">): boolean | "caret" {
  let changed = false;
  let caret: Node | null = null;
  for (const el of textBlocks(root, range)) {
    if (el.tagName === "LI") {
      if (kind === "p") continue;
      const own = ownNodes(el);
      const h = el.ownerDocument.createElement(kind);
      el.insertBefore(h, own[0] ?? [...el.children].find(isList) ?? null);
      h.append(...own);
      if (!h.childNodes.length) h.append(el.ownerDocument.createElement("br"));
      changed = true;
    } else if (el.tagName === "PRE") {
      const blocks = preToBlocks(el, kind);
      caret ??= blocks[0];
      changed = true;
    } else if (el.tagName.toLowerCase() !== kind) {
      if (kind === "p" && el.parentElement?.tagName === "LI") el.replaceWith(...el.childNodes);
      else retag(el, kind);
      changed = true;
    }
  }
  if (caret) {
    setCaret(caret, 0);
    return "caret";
  }
  return changed;
}

/** A code block from the selected paragraphs (their lines joined), or paragraphs from the code block the caret is in */
export function toggleCodeBlock(root: HTMLElement, range: Range): boolean | "caret" {
  const pre = closestIn(range.startContainer, /^PRE$/, root);
  if (pre) {
    setCaret(preToBlocks(pre, "p")[0], 0);
    return "caret";
  }
  const blocks = textBlocks(root, range).filter((b) => /^(P|H[1-6])$/.test(b.tagName));
  if (!blocks.length) return false;
  const group = blocks.filter((b) => b.parentElement === blocks[0].parentElement);
  const text = group.map((b) => (b.textContent ?? "").replace(/​/g, "")).join("\n");
  const doc = root.ownerDocument;
  const block = doc.createElement("pre");
  const code = doc.createElement("code");
  code.textContent = text + "\n";
  block.append(code);
  group[0].before(block);
  group.forEach((b) => b.remove());
  setCaret(code.firstChild!, text.length);
  return "caret";
}

/** Each block's ancestor that sits straight in `root` */
function topOf(el: HTMLElement, root: HTMLElement): HTMLElement {
  let n = el;
  while (n.parentElement && n.parentElement !== root) n = n.parentElement;
  return n;
}

/** Out of the quote the caret is in, or the selected blocks into a new one */
export function toggleQuote(root: HTMLElement, range: Range): boolean {
  const q = closestIn(range.startContainer, /^BLOCKQUOTE$/, root);
  if (q) {
    q.replaceWith(...q.childNodes);
    return true;
  }
  const blocks = textBlocks(root, range);
  if (!blocks.length) return false;
  const tops = [...new Set(blocks.map((b) => topOf(b, root)))];
  const quote = root.ownerDocument.createElement("blockquote");
  tops[0].before(quote);
  quote.append(...tops);
  return true;
}

/** A rule after the block the caret is in (or instead of it, when it is empty), and the caret in a new paragraph after it */
export function insertRule(root: HTMLElement, range: Range): "caret" {
  const doc = root.ownerDocument;
  const leaf = leafOf(range.startContainer, root);
  const hr = doc.createElement("hr");
  const p = emptyParagraph(doc);
  if (leaf && /^(P|H[1-6])$/.test(leaf.tagName) && isEmptyBlock(leaf) && !leaf.closest("li")) leaf.replaceWith(hr, p);
  else if (leaf && !leaf.closest("li,td,th")) leaf.after(hr, p);
  else if (leaf) topOf(leaf, root).after(hr, p);
  else root.append(hr, p);
  setCaret(p, 0);
  return "caret";
}

/**
 * A picture at the caret. Markdown pictures sit in text, but one usually wants its own line: it
 * replaces an empty paragraph, goes in a new paragraph after (or before) the one the caret is at
 * the end (or start) of, and only lands mid-line when the caret is mid-line.
 */
export function insertImage(root: HTMLElement, range: Range | null, img: HTMLImageElement): "caret" {
  const doc = root.ownerDocument;
  const leaf = range ? leafOf(range.startContainer, root) : null;
  const own = () => {
    const p = doc.createElement("p");
    p.append(img);
    return p;
  };
  if (!range || !leaf) root.append(own());
  else if (/^(PRE|TD|TH|H[1-6])$/.test(leaf.tagName)) leaf.after(own());
  else if (isEmptyBlock(leaf) && leaf.tagName === "P") leaf.replaceChildren(img);
  else if (leaf.tagName !== "LI" && !textAfter(leaf, range)) leaf.after(own());
  else if (leaf.tagName !== "LI" && !textBefore(leaf, range)) leaf.before(own());
  else {
    range.deleteContents();
    range.insertNode(img);
  }
  caretAfter(img);
  return "caret";
}

/** Inline code: the selection (within one block) into <code>, or out of the code it is in */
export function toggleInlineCode(root: HTMLElement, range: Range): boolean | "caret" {
  const doc = root.ownerDocument;
  const code = closestIn(range.startContainer, /^CODE$/, root);
  if (code && !code.closest("pre")) {
    if (range.collapsed && !(code.textContent ?? "").replace(/​/g, "")) {
      code.remove();
      return true;
    }
    code.replaceWith(...code.childNodes);
    return true;
  }
  if (closestIn(range.startContainer, /^PRE$/, root)) return false;
  const leaf = leafOf(range.startContainer, root);
  if (leaf && !leaf.contains(range.endContainer)) range.setEndAfter(leaf.lastChild ?? leaf);
  const c = doc.createElement("code");
  if (range.collapsed) {
    // Somewhere for the caret to type into; the zero-width space is dropped when written out
    c.textContent = "​";
    range.insertNode(c);
    setCaret(c.firstChild!, 1);
    return "caret";
  }
  c.textContent = range.toString().replace(/\n/g, " ");
  range.deleteContents();
  range.insertNode(c);
  doc.getSelection()?.selectAllChildren(c);
  return "caret";
}

/** Moves the caret out past the end of an inline element (code, link) it is at the end of */
export function stepOut(el: HTMLElement): "caret" {
  const next = el.nextSibling;
  if (next?.nodeType === 3 && (next.nodeValue ?? "").length) setCaret(next, (next.nodeValue ?? "").startsWith("​") ? 1 : 0);
  else {
    const t = el.ownerDocument.createTextNode("​");
    el.after(t);
    setCaret(t, 1);
  }
  return "caret";
}

// ---------------------------------------------------------------------------------------------
// Lists

function taskBox(doc: Document, checked = false): HTMLElement {
  const s = doc.createElement("span");
  s.setAttribute("contenteditable", "false");
  s.setAttribute("data-task", "");
  const box = doc.createElement("input");
  box.type = "checkbox";
  box.tabIndex = -1;
  box.setAttribute("aria-label", "Done");
  if (checked) box.setAttribute("checked", "");
  s.append(box);
  return s;
}

/** Makes a list item a task (a checkbox at its start) or a plain item again */
export function setTask(li: HTMLElement, on: boolean, checked = false) {
  const box = li.querySelector(":scope > [data-task]");
  if (on && !box) {
    li.prepend(taskBox(li.ownerDocument, checked));
    li.classList.add("task-list-item");
    li.setAttribute("data-checked", String(checked));
  } else if (!on && box) {
    box.remove();
    li.classList.remove("task-list-item");
    li.removeAttribute("data-checked");
    if (!li.getAttribute("class")) li.removeAttribute("class");
  }
  if (li.parentElement) fixTaskClass(li.parentElement);
}

/** The list items the range touches, in document order */
export function selectedItems(root: HTMLElement, range: Range): HTMLElement[] {
  const items = new Set<HTMLElement>();
  for (const b of textBlocks(root, range)) {
    const li = b.tagName === "LI" ? b : closestIn(b, /^LI$/, root);
    if (li) items.add(li);
  }
  return [...items];
}

/** The items whose parent item isn't also in the list (moving a parent moves its children) */
const outermost = (items: HTMLElement[]) => items.filter((li) => !items.some((o) => o !== li && o.contains(li)));

/** One level in: into a list inside the item before it. Returns false at the top of a list. */
export function indentItem(li: HTMLElement): boolean {
  const prev = li.previousElementSibling as HTMLElement | null;
  const list = li.parentElement;
  if (!prev || prev.tagName !== "LI" || !list) return false;
  let sub = prev.lastElementChild as HTMLElement | null;
  if (!isList(sub)) {
    sub = li.ownerDocument.createElement(list.tagName.toLowerCase());
    prev.append(sub);
  }
  sub.append(li);
  fixTaskClass(sub);
  fixTaskClass(list);
  return true;
}

/**
 * One level out: after its parent item, taking the items after it along as its own sub-list. At
 * the top level the item leaves the list and becomes a paragraph (and the list splits there).
 */
export function outdentItem(li: HTMLElement): HTMLElement | null {
  const list = li.parentElement;
  if (!list || !isList(list)) return null;
  const doc = li.ownerDocument;
  const after = [] as Element[];
  for (let n = li.nextElementSibling; n; n = n.nextElementSibling) after.push(n);
  const parentItem = list.parentElement?.tagName === "LI" ? list.parentElement : null;
  if (parentItem) {
    if (after.length) {
      let own = li.lastElementChild as HTMLElement | null;
      if (!isList(own)) {
        own = doc.createElement(list.tagName.toLowerCase());
        li.append(own);
      }
      own.append(...after);
    }
    parentItem.after(li);
    if (!list.children.length) list.remove();
    else fixTaskClass(list);
    if (li.parentElement) fixTaskClass(li.parentElement);
    return li;
  }
  if (after.length) {
    const tail = list.cloneNode(false) as HTMLElement;
    tail.append(...after);
    list.after(tail);
    fixTaskClass(tail);
  }
  const blocks: Node[] = [];
  const own = ownNodes(li);
  if (own.length) {
    const p = doc.createElement("p");
    p.append(...own);
    blocks.push(p);
  }
  for (const c of [...li.childNodes]) if (isEl(c) && BLOCK.test(c.tagName)) blocks.push(c);
  if (!blocks.length) blocks.push(emptyParagraph(doc));
  list.after(...blocks);
  li.remove();
  if (!list.children.length) list.remove();
  else fixTaskClass(list);
  return blocks[0] as HTMLElement;
}

export function indentItems(root: HTMLElement, range: Range, out: boolean): boolean {
  const items = outermost(selectedItems(root, range));
  let changed = false;
  for (const li of items) changed = (out ? !!outdentItem(li) : indentItem(li)) || changed;
  return changed;
}

function retagList(list: HTMLElement, tag: "ul" | "ol"): HTMLElement {
  if (list.tagName.toLowerCase() === tag) return list;
  const n = retag(list, tag);
  if (tag === "ul") n.removeAttribute("start");
  return n;
}

/**
 * Bulleted, numbered or task list. When every block in the range is already in a list of that
 * kind, they leave their lists; items in other lists change kind (a list's type is the whole
 * list's, a task box is each item's); paragraphs and headings become items of a new list, joined
 * to a list of the same type right before or after.
 */
export function toggleList(root: HTMLElement, range: Range, kind: ListKind): boolean {
  const doc = root.ownerDocument;
  const blocks = textBlocks(root, range);
  if (!blocks.length) return false;
  const items = selectedItems(root, range);
  const free = blocks.filter((b) => b.tagName !== "LI" && !closestIn(b, /^LI$/, root));
  const tag = kind === "ol" ? "ol" : "ul";
  if (!free.length && items.every((li) => listKind(li) === kind)) {
    for (const li of [...items].reverse()) {
      let cur: HTMLElement | null = li;
      while (cur?.tagName === "LI") cur = outdentItem(cur);
    }
    return true;
  }
  for (const li of items) {
    if (listKind(li) === kind) continue;
    if (li.parentElement) retagList(li.parentElement, tag);
    setTask(li, kind === "task");
  }
  // Runs of neighbouring paragraphs become one list each
  const runs: HTMLElement[][] = [];
  for (const b of free) {
    const run = runs[runs.length - 1];
    if (run && run[run.length - 1].nextElementSibling === b) run.push(b);
    else runs.push([b]);
  }
  for (const run of runs) {
    let list: HTMLElement = doc.createElement(tag);
    run[0].before(list);
    for (const b of run) {
      const li = doc.createElement("li");
      list.append(li);
      if (b.tagName === "PRE") li.append(b);
      else {
        li.append(...b.childNodes);
        b.remove();
      }
      if (!li.childNodes.length) li.append(doc.createElement("br"));
      if (kind === "task") setTask(li, true);
    }
    const prev = list.previousElementSibling;
    if (prev?.tagName === list.tagName) {
      prev.append(...list.children);
      list.remove();
      list = prev as HTMLElement;
    }
    const next = list.nextElementSibling;
    if (next?.tagName === list.tagName) {
      list.append(...next.children);
      next.remove();
    }
    fixTaskClass(list);
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Changes made elsewhere

/** The area's top-level blocks as HTML, without passing marks */
export function blocksOf(root: HTMLElement): string[] {
  return [...root.children].map((c) => {
    if (!c.querySelector("[data-selected]") && !c.hasAttribute("data-selected")) return c.outerHTML;
    const clone = c.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-selected");
    clone.querySelectorAll("[data-selected]").forEach((e) => e.removeAttribute("data-selected"));
    return clone.outerHTML;
  });
}

/** One change of top-level blocks: `removed` (as HTML) at `at` became `added` */
export interface BlockPatch {
  at: number;
  removed: string[];
  added: string[];
}

/**
 * Brings the area to `html` (the editable HTML of the new Markdown) by replacing only the run of
 * top-level blocks whose Markdown (`keyOf`) differs; everything before and after it, and the
 * selection in it, is left alone. A selection inside the replaced run moves to the same character
 * offset in the new one. A trailing empty paragraph (kept for the caret) isn't compared. Returns
 * what changed, or null when nothing did.
 */
export function patchArea(root: HTMLElement, html: string, keyOf: (el: Element) => string): BlockPatch | null {
  const doc = root.ownerDocument;
  const t = doc.createElement("template");
  t.innerHTML = html;
  const next = [...t.content.children] as HTMLElement[];
  const cur = [...root.children] as HTMLElement[];
  const ck = cur.map(keyOf);
  const nk = next.map(keyOf);
  let end = cur.length;
  while (end > 0 && ck[end - 1] === "" && nk[next.length - 1] !== "") end--;
  let p = 0;
  while (p < end && p < next.length && ck[p] === nk[p]) p++;
  let q = 0;
  while (q < end - p && q < next.length - p && ck[end - 1 - q] === nk[next.length - 1 - q]) q++;
  const removed = cur.slice(p, end - q);
  const added = next.slice(p, next.length - q);
  if (!removed.length && !added.length) return null;
  const before = blocksOf(root).slice(p, end - q);

  // The selection, if it is in the run that goes: as character offsets from the area's start
  const sel = doc.getSelection();
  const inRun = (n: Node | null) => !!n && removed.some((b) => b.contains(n));
  const points =
    sel?.rangeCount && root.contains(sel.anchorNode) && (inRun(sel.anchorNode) || inRun(sel.focusNode))
      ? { a: textOffset(root, sel.anchorNode!, sel.anchorOffset), f: textOffset(root, sel.focusNode!, sel.focusOffset) }
      : null;

  const ref = cur[end - q] ?? cur[end] ?? null;
  for (const b of added) root.insertBefore(b, ref);
  for (const b of removed) b.remove();

  if (points && sel) {
    const last = textOffset(root, root, p + added.length);
    const at = (n: number) => pointAt(root, Math.min(n, Math.max(0, last - 1)));
    try {
      const a = at(points.a);
      const f = at(points.f);
      sel.setBaseAndExtent(a.node, a.offset, f.node, f.offset);
    } catch {
      // No caret position there: leave the browser's
    }
  }
  return { at: p, removed: before, added: added.map((b) => b.outerHTML) };
}

/** For each block of `a`, the index of the same block in `b`, by a longest common subsequence */
function alignBlocks(a: string[], b: string[]): (number | undefined)[] {
  const map: (number | undefined)[] = new Array(a.length);
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) map[p] = p++;
  let q = 0;
  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) {
    map[a.length - 1 - q] = b.length - 1 - q;
    q++;
  }
  const A = a.slice(p, a.length - q);
  const B = b.slice(p, b.length - q);
  if (!A.length || !B.length) return map;
  const dp = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  for (let i = 0, j = 0; i < A.length && j < B.length; ) {
    if (A[i] === B[j]) {
      map[p + i] = p + j;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return map;
}

/**
 * A history entry with a change made elsewhere applied to it too, so that undoing to it doesn't
 * take that change back. `base` is the area's blocks the patch was made against. Null when the
 * entry's version of those blocks differs (your own edits there): that step can't be kept.
 */
export function rebaseSnapshot(snap: Snapshot, base: string[], patch: BlockPatch): Snapshot | null {
  const map = alignBlocks(base, snap.blocks);
  const { at, removed, added } = patch;
  let pos: number;
  if (removed.length) {
    pos = map[at] ?? -1;
    if (pos < 0) return null;
    for (let k = 1; k < removed.length; k++) if (map[at + k] !== pos + k) return null;
  } else if (at > 0 && map[at - 1] != null) pos = map[at - 1]! + 1;
  else if (at < base.length && map[at] != null) pos = map[at]!;
  else if (at === 0) pos = 0;
  else return null;
  const blocks = [...snap.blocks.slice(0, pos), ...added, ...snap.blocks.slice(pos + removed.length)];
  const shift = added.length - removed.length;
  const move = (path: number[]) => (path[0] < pos ? path : path[0] >= pos + removed.length ? [path[0] + shift, ...path.slice(1)] : null);
  const s = snap.selection;
  const anchor = s && move(s.anchor);
  const focus = s && move(s.focus);
  return { html: blocks.join(""), blocks, selection: s && anchor && focus ? { ...s, anchor, focus } : null };
}
