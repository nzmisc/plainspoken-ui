"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { cn } from "@/lib/utils";

/** Which chart colour a person has: 1 to 5 */
export type PersonColor = 1 | 2 | 3 | 4 | 5;

/** Someone working on the same thing as you */
export interface Collaborator {
  id: string;
  name: string;
  color: PersonColor;
  /** Picture URL; the initials show until it loads, or if it fails */
  src?: string;
}

/**
 * The classes for a person's colour. Written out in full so Tailwind finds them. `fg` is for text
 * on a plain background only where it is large or bold; labels use the border with foreground text,
 * which stays readable in both schemes.
 */
export const PERSON_COLORS: Record<PersonColor, { bg: string; tint: string; border: string; outline: string; fg: string }> = {
  1: { bg: "bg-chart-1", tint: "bg-chart-1/20", border: "border-chart-1", outline: "outline-chart-1", fg: "text-chart-1" },
  2: { bg: "bg-chart-2", tint: "bg-chart-2/20", border: "border-chart-2", outline: "outline-chart-2", fg: "text-chart-2" },
  3: { bg: "bg-chart-3", tint: "bg-chart-3/20", border: "border-chart-3", outline: "outline-chart-3", fg: "text-chart-3" },
  4: { bg: "bg-chart-4", tint: "bg-chart-4/20", border: "border-chart-4", outline: "outline-chart-4", fg: "text-chart-4" },
  5: { bg: "bg-chart-5", tint: "bg-chart-5/20", border: "border-chart-5", outline: "outline-chart-5", fg: "text-chart-5" },
};

/** The first name, for labels: "Jonas Weber" → "Jonas" */
export const firstName = (person: Collaborator) => person.name.trim().split(/\s+/)[0];

// ---------------------------------------------------------------------------------------------
// Who's here

export interface PresenceAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  person: Collaborator;
  /** What they are doing, added to the accessible name and the hover text: "typing" */
  status?: string;
  /** Gone quiet or offline: drawn faded */
  away?: boolean;
  size?: number;
}

/** A person's round avatar in their colour, with what they are doing in its name ("Jonas Weber, typing") */
export function PresenceAvatar({ person, status, away, size = 24, className, ...rest }: PresenceAvatarProps) {
  const name = status ? `${person.name}, ${status}` : person.name;
  return (
    <Avatar
      name={person.name}
      src={person.src}
      size={size}
      shape="circle"
      aria-label={name}
      title={name}
      className={cn(PERSON_COLORS[person.color].bg, away && "opacity-45", className)}
      {...rest}
    />
  );
}

export interface PresenceEntry {
  person: Collaborator;
  /** "typing", "viewing", "offline" */
  status?: string;
  away?: boolean;
}

export interface FacepileProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  people: PresenceEntry[];
  /** Accessible name of the group. Default "Here now". */
  label?: string;
  /** Show at most this many, then "+3" */
  max?: number;
  size?: number;
  /** Text after the avatars: "Jonas is typing…" */
  caption?: ReactNode;
}

/**
 * Who else has this open: round avatars in each person's colour, faded for those gone quiet, with
 * an optional caption after them. Each avatar's name says what that person is doing. Says
 * "Only you" when nobody else is here, so the space doesn't jump when someone arrives.
 */
export function Facepile({ people, label = "Here now", max = 4, size = 24, caption, className, ...rest }: FacepileProps) {
  return (
    <span data-slot="facepile" className={cn("inline-flex min-h-6 items-center gap-2 text-[13px]", className)} {...rest}>
      {people.length > 0 ? (
        <AvatarGroup label={label} max={max} size={size} shape="circle">
          {people.map((p) => (
            <Avatar
              key={p.person.id}
              name={p.person.name}
              src={p.person.src}
              aria-label={p.status ? `${p.person.name}, ${p.status}` : p.person.name}
              title={p.status ? `${p.person.name}, ${p.status}` : p.person.name}
              className={cn(PERSON_COLORS[p.person.color].bg, p.away && "opacity-45")}
            />
          ))}
        </AvatarGroup>
      ) : (
        <span className="text-muted-foreground">Only you</span>
      )}
      {caption != null && caption !== false && <span className="min-w-0 truncate text-muted-foreground">{caption}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Labels and rings

export interface PresenceLabelProps extends HTMLAttributes<HTMLSpanElement> {
  person: Collaborator;
  /** The words. Default: the first name. */
  children?: ReactNode;
}

/**
 * A small tag in a person's colour: "Jonas is typing…", or the name on a remote cursor. A
 * coloured border and edge with ordinary text, so it reads well on both schemes and over text.
 */
export function PresenceLabel({ person, children, className, ...rest }: PresenceLabelProps) {
  return (
    <span
      data-slot="presence-label"
      className={cn(
        "inline-flex h-[18px] items-center gap-1 border border-l-[3px] bg-background px-1 text-[12px] leading-none font-medium whitespace-nowrap text-foreground",
        PERSON_COLORS[person.color].border,
        className,
      )}
      {...rest}
    >
      {children ?? firstName(person)}
    </span>
  );
}

export interface PresenceFrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Who is there. Leave out (or set `active` false) for no ring. */
  person?: Collaborator;
  active?: boolean;
  /** The tag on the ring: "Jonas is typing…". Default: "<first name> is here". */
  label?: ReactNode;
  /** id for the tag, so the field inside can point at it with aria-describedby */
  labelId?: string;
}

/**
 * A ring in someone's colour around a field they are in, with a tag on its top edge saying so.
 * The ring sits outside your own focus ring, so both show at once. Point the field's
 * aria-describedby at `labelId` so focusing it says who else is there.
 */
export function PresenceFrame({ person, active = true, label, labelId, className, children, ...rest }: PresenceFrameProps) {
  const on = active && person;
  return (
    <div
      data-slot="presence-frame"
      data-active={on ? "" : undefined}
      className={cn("relative", on && cn("outline-2 outline-offset-3", PERSON_COLORS[person.color].outline), className)}
      {...rest}
    >
      {children}
      {on && (
        <PresenceLabel id={labelId} person={person} className="absolute -top-[23px] -right-[5px]">
          {label ?? `${firstName(person)} is here`}
        </PresenceLabel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Remote cursors

/** Another person's caret or selection in a text, as offsets */
export interface RemoteCursor {
  person: Collaborator;
  start: number;
  end: number;
  /** Words on the flag over the caret. Default: the first name. */
  label?: ReactNode;
  /** Only tint the range: no caret, no flag (text that just arrived, say) */
  highlight?: boolean;
  /**
   * Show the name flag. Default true. A flag covers the line above it, so live editors usually show
   * it only while the person types and leave just the coloured caret otherwise.
   */
  flag?: boolean;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Placed {
  cursor: RemoteCursor;
  rects: Box[];
  caret: Box | null;
}

/** Draws placed carets, selections and their flags; positioned in the box its parent gives it */
function CursorMarks({ placed, clip }: { placed: Placed[]; clip?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", clip && "overflow-hidden")}>
      {placed.map(({ cursor, rects, caret }, i) => {
        const c = PERSON_COLORS[cursor.person.color];
        return (
          <div key={`${cursor.person.id}-${i}`}>
            {rects.map((r, j) => (
              <div key={j} className={cn("absolute", c.tint)} style={{ top: r.top, left: r.left, width: Math.max(r.width, 2), height: r.height }} />
            ))}
            {caret && !cursor.highlight && (
              <>
                <div className={cn("absolute w-0.5", c.bg)} style={{ top: caret.top, left: caret.left - 1, height: caret.height }} />
                {cursor.flag !== false && (
                  <PresenceLabel
                    person={cursor.person}
                    className="absolute h-4 px-0.5 text-[11px]"
                    // Over the line, or under it on the first line where there's no room above
                    style={caret.top >= 16 ? { top: caret.top - 16, left: caret.left - 1 } : { top: caret.top + caret.height, left: caret.left - 1 }}
                  >
                    {cursor.label ?? firstName(cursor.person)}
                  </PresenceLabel>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

const MIRRORED = [
  "boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontStretch",
  "fontSize", "fontFamily", "fontFeatureSettings", "fontVariationSettings", "lineHeight", "letterSpacing", "wordSpacing",
  "textAlign", "textTransform", "textIndent", "tabSize", "wordBreak", "overflowWrap", "whiteSpace",
] as const;

/**
 * Where ranges of a textarea's text are on screen, from a hidden copy of it with the same font,
 * width and padding (a textarea has no way to ask). Boxes are relative to the textarea's border
 * box, scrolled with its content.
 */
function measureTextarea(el: HTMLTextAreaElement, ranges: { start: number; end: number }[]): { rects: Box[]; caret: Box }[] {
  const style = getComputedStyle(el);
  const mirror = document.createElement("div");
  for (const p of MIRRORED) mirror.style[p] = style[p];
  Object.assign(mirror.style, {
    position: "absolute",
    top: "0",
    left: "-9999px",
    visibility: "hidden",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    height: "auto",
    // The textarea's scrollbar takes width from its text: so does the copy's
    overflowY: el.scrollHeight > el.clientHeight ? "scroll" : "hidden",
  });
  document.body.appendChild(mirror);
  const value = el.value;
  const out = ranges.map(({ start, end }) => {
    const s = Math.max(0, Math.min(start, value.length));
    const e = Math.max(s, Math.min(end, value.length));
    mirror.textContent = value.slice(0, s);
    const sel = document.createElement("span");
    // An empty span has no box; a zero-width space gives the caret's line
    sel.textContent = value.slice(s, e) || "​";
    const caretSpan = document.createElement("span");
    caretSpan.textContent = "​";
    mirror.append(sel, caretSpan, document.createTextNode(value.slice(e) || " "));
    const base = mirror.getBoundingClientRect();
    const shift = (r: DOMRect): Box => ({ top: r.top - base.top - el.scrollTop, left: r.left - base.left - el.scrollLeft, width: r.width, height: r.height });
    const rects = s === e ? [] : Array.from(sel.getClientRects(), shift).filter((r) => r.width > 0.5);
    const c = shift(caretSpan.getBoundingClientRect());
    return { rects, caret: { ...c, width: 0 } };
  });
  mirror.remove();
  return out;
}

/** Re-runs `measure` after layout, on resize, on scroll of `scroller`, and when the fonts arrive */
function useMeasured<T>(measure: () => T, deps: unknown[], observe: RefObject<HTMLElement | null>, scroller?: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<T | null>(null);
  const fn = useRef(measure);
  useLayoutEffect(() => {
    fn.current = measure;
  });
  const run = useCallback(() => setState(fn.current()), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps say when to measure again
  useLayoutEffect(run, deps);
  useEffect(() => {
    const el = observe.current;
    const sc = scroller?.current;
    const ro = new ResizeObserver(run);
    if (el) ro.observe(el);
    sc?.addEventListener("scroll", run, { passive: true });
    document.fonts?.ready.then(run).catch(() => {});
    return () => {
      ro.disconnect();
      sc?.removeEventListener("scroll", run);
    };
  }, [observe, scroller, run]);
  return state;
}

export interface TextareaCursorsProps {
  /** The textarea the cursors are in. Wrap it and this in one `relative` box the textarea's size. */
  textarea: RefObject<HTMLTextAreaElement | null>;
  /** The textarea's current value: when it changes, the marks are placed again */
  value: string;
  cursors: RemoteCursor[];
}

/**
 * Other people's carets and selections over a textarea, each in their colour with their name on
 * a flag: a hidden copy of the textarea works out where the offsets fall. Put it next to the
 * textarea inside a `relative` wrapper. Purely visual (aria-hidden): say who is where in words
 * as well, with a Facepile or an aria-describedby.
 */
export function TextareaCursors({ textarea, value, cursors }: TextareaCursorsProps) {
  const key = cursors.map((c) => `${c.person.id}:${c.start}-${c.end}:${c.highlight ? 1 : 0}`).join("|");
  const placed = useMeasured<Placed[]>(
    () => {
      const el = textarea.current;
      if (!el || cursors.length === 0) return [];
      return measureTextarea(el, cursors).map((m, i) => ({ cursor: cursors[i], ...m }));
    },
    [key, value],
    textarea,
    textarea,
  );
  return <CursorMarks placed={placed ?? []} clip />;
}

/**
 * A DOM Range over characters `start` to `end` of an element's text, counting through its text
 * nodes: for placing remote cursors over rendered or contenteditable text.
 */
export function textRange(root: Node, start: number, end: number = start): Range | null {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let pos = 0;
  let started = false;
  let last: Text | null = null;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (!started && start <= pos + len) {
      range.setStart(n, start - pos);
      started = true;
    }
    if (started && end <= pos + len) {
      range.setEnd(n, end - pos);
      return range;
    }
    pos += len;
    last = n;
  }
  if (!last) {
    range.selectNodeContents(root);
    range.collapse(true);
    return range;
  }
  if (!started) range.setStart(last, last.data.length);
  range.setEnd(last, last.data.length);
  return range;
}

/** A remote cursor in one element of a rendered document */
export interface DomCursor extends RemoteCursor {
  /** The element whose text the offsets count through (a paragraph, a list item) */
  element: HTMLElement | null;
}

export interface DomCursorsProps {
  /** The positioned (`relative`) box the marks are drawn in; usually the document's wrapper */
  container: RefObject<HTMLElement | null>;
  cursors: DomCursor[];
  /** Anything that changes the layout or the text: the marks are placed again when it changes */
  version?: unknown;
}

/**
 * Other people's carets and selections over HTML text (a rendered or contenteditable document),
 * from DOM Ranges over each cursor's element. Draws inside `container`, which must be
 * positioned. Purely visual (aria-hidden).
 */
export function DomCursors({ container, cursors, version }: DomCursorsProps) {
  const key = cursors.map((c) => `${c.person.id}:${c.start}-${c.end}`).join("|");
  const placed = useMeasured<Placed[]>(
    () => {
      const box = container.current;
      if (!box) return [];
      const origin = box.getBoundingClientRect();
      const shift = (r: DOMRect): Box => ({ top: r.top - origin.top + box.scrollTop, left: r.left - origin.left + box.scrollLeft, width: r.width, height: r.height });
      return cursors.flatMap((cursor) => {
        if (!cursor.element?.isConnected) return [];
        const range = textRange(cursor.element, cursor.start, cursor.end);
        if (!range) return [];
        const rects = cursor.start === cursor.end ? [] : Array.from(range.getClientRects(), shift).filter((r) => r.width > 0.5);
        const end = range.cloneRange();
        end.collapse(false);
        let caretRect = end.getClientRects()[0] ?? end.getBoundingClientRect();
        // An empty element gives an empty rect: use the element's first line
        if (!caretRect || (caretRect.height === 0 && caretRect.top === 0)) {
          const r = cursor.element.getBoundingClientRect();
          const lh = parseFloat(getComputedStyle(cursor.element).lineHeight) || 20;
          caretRect = new DOMRect(r.left + parseFloat(getComputedStyle(cursor.element).paddingLeft || "0"), r.top, 0, lh);
        }
        return [{ cursor, rects, caret: shift(caretRect) }];
      });
    },
    [key, version],
    container,
  );
  return <CursorMarks placed={placed ?? []} />;
}

/** "Jonas is editing" next to a block of a document */
export interface BlockMark {
  person: Collaborator;
  /** The paragraph, heading or list item */
  element: HTMLElement | null;
  /** Default: "<first name> is editing" */
  label?: ReactNode;
}

export interface BlockMarksProps {
  /** The positioned (`relative`) box the marks are drawn in */
  container: RefObject<HTMLElement | null>;
  marks: BlockMark[];
  /** Where the labels go: in a gutter to the right of the container's content (leave room with padding), or nowhere (bars only). Default "right". */
  labels?: "right" | "none";
  /** Anything that changes the layout: the marks are placed again when it changes */
  version?: unknown;
}

/**
 * Who is working where in a document, a block at a time: a bar in their colour beside the
 * paragraph, and their tag in the gutter level with it. Coarser and calmer than cursors, and
 * readable at a glance in a long document. Purely visual (aria-hidden).
 */
export function BlockMarks({ container, marks, labels = "right", version }: BlockMarksProps) {
  const key = marks.map((m) => `${m.person.id}:${m.element ? Array.prototype.indexOf.call(m.element.parentElement?.children ?? [], m.element) : -1}`).join("|");
  const placed = useMeasured(
    () => {
      const box = container.current;
      if (!box) return [];
      const origin = box.getBoundingClientRect();
      return marks.flatMap((m) => {
        if (!m.element?.isConnected) return [];
        const r = m.element.getBoundingClientRect();
        return [{ mark: m, top: r.top - origin.top + box.scrollTop, left: r.left - origin.left, height: r.height, right: origin.right - r.right }];
      });
    },
    [key, version],
    container,
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {(placed ?? []).map(({ mark, top, left, height }, i) => (
        <div key={`${mark.person.id}-${i}`}>
          <div className={cn("absolute w-[3px]", PERSON_COLORS[mark.person.color].bg)} style={{ top, left: left - 7, height }} />
          {labels === "right" && (
            <PresenceLabel person={mark.person} className="absolute right-1" style={{ top: top + 1 }}>
              {mark.label ?? `${firstName(mark.person)} is editing`}
            </PresenceLabel>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Announcing

/**
 * Polite announcements of things other people do, at most one per `gap` ms: a burst of remote
 * edits becomes one message (the latest) rather than a stream. Render the returned `message`
 * with <Announcer>. Never moves focus.
 */
export function useAnnouncer(gap = 4000) {
  const [message, setMessage] = useState({ text: "", n: 0 });
  const last = useRef(0);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const announce = useCallback(
    (text: string) => {
      const now = Date.now();
      const flush = () => {
        last.current = Date.now();
        const t = pending.current;
        pending.current = null;
        if (t) setMessage((m) => ({ text: t, n: m.n + 1 }));
      };
      pending.current = text;
      if (now - last.current >= gap) flush();
      else if (!timer.current) {
        timer.current = setTimeout(() => {
          timer.current = undefined;
          flush();
        }, gap - (now - last.current));
      }
    },
    [gap],
  );
  return { message, announce };
}

/** The live region for useAnnouncer's messages: visually hidden, polite */
export function Announcer({ message }: { message: { text: string; n: number } }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {/* A new key per message, so the same words said twice are heard twice */}
      <span key={message.n}>{message.text}</span>
    </div>
  );
}
