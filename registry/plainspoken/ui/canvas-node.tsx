"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { rectsIntersect, useCanvas, type CanvasPoint } from "@/registry/plainspoken/ui/canvas";
import { cn } from "@/lib/utils";

/** What moved, passed with every position change */
export interface CanvasNodeMove {
  /** The nodes that moved */
  ids: string[];
  /** A pointer drag reports many times while moving (false) and once more when dropped (true); a keyboard move is always done */
  done: boolean;
  source: "pointer" | "keyboard";
}

export interface CanvasNodesProps {
  /** Where each node is (its top left corner), in canvas coordinates, by node id */
  positions: Record<string, CanvasPoint>;
  /** New positions, while dragging and when dropped (see `move.done`), and after arrow keys */
  onPositionsChange?: (positions: Record<string, CanvasPoint>, move: CanvasNodeMove) => void;
  /** Controlled selection: node ids */
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Snap dragged nodes to this grid (canvas px); 0 or leave out for free movement. Match the Canvas's `gridSize`. */
  snap?: number;
  /** One arrow key press, canvas px; Shift moves 10×. Default the snap, or 10. */
  keyboardStep?: number;
  /** Enter or a double-click on a node: open its details */
  onOpen?: (id: string) => void;
  /** Delete or Backspace on a node: remove the selected nodes. Leave out and the keys do nothing. */
  onDelete?: (ids: string[]) => void;
  /** What the live region says after a move. Default: "orders moved to 240, 80", or "3 nodes moved". */
  describeMove?: (names: string[], positions: CanvasPoint[]) => string;
  /** Pan the canvas while a node is dragged against its edge. Default true. */
  autoPan?: boolean;
  /** What screen readers call a node: "node" by default; "table", "card" */
  roleDescription?: string;
  /** More keys, added to what screen readers say about every node: "F folds it." */
  keyHelp?: string;
  children: ReactNode;
}

interface NodesContext {
  positions: Record<string, CanvasPoint>;
  selected: ReadonlySet<string>;
  z: ReadonlyMap<string, number>;
  snap: number;
  step: number;
  autoPan: boolean;
  roleDescription: string;
  descId: string;
  selId: string;
  /** The latest props and selection, for handlers that run between renders (a drag) */
  latest: { current: { positions: Record<string, CanvasPoint>; selected: string[] } };
  names: Map<string, string>;
  select: (ids: string[]) => void;
  change: (positions: Record<string, CanvasPoint>, move: CanvasNodeMove) => void;
  announceMove: (ids: string[], positions: Record<string, CanvasPoint>) => void;
  announce: (message: string) => void;
  onOpen?: (id: string) => void;
  onDelete?: (ids: string[]) => void;
}

const Ctx = createContext<NodesContext | null>(null);

function useNodes(): NodesContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("CanvasNode must be inside <CanvasNodes>");
  return c;
}

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

const defaultDescribe = (names: string[], positions: CanvasPoint[]) =>
  names.length === 1 ? `${names[0]} moved to ${Math.round(positions[0].x)}, ${Math.round(positions[0].y)}` : `${names.length} nodes moved`;

/**
 * Makes the CanvasNodes inside it draggable and selectable, and keeps their positions and the
 * selection (controlled or not). Put it inside a Canvas, around the nodes.
 *
 * Pointer: drag a node to move it, with every other selected node; Shift, Ctrl or ⌘ + click adds
 * or removes one; drag a box on the background (Shift+drag, or the canvas's select tool) to
 * select the nodes it touches; a click on the background clears the selection. Keyboard, on a
 * focused node: arrow keys move it (and the rest of the selection), Shift for 10× steps; Space
 * selects or deselects it; Enter opens it (`onOpen`); Escape clears the selection; Ctrl or ⌘ + A
 * selects every node; Delete removes them if `onDelete` is set. Moves are announced politely.
 * The nodes last selected are drawn on top.
 */
export function CanvasNodes({
  positions,
  onPositionsChange,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  snap = 0,
  keyboardStep,
  onOpen,
  onDelete,
  describeMove = defaultDescribe,
  autoPan = true,
  roleDescription = "node",
  keyHelp,
  children,
}: CanvasNodesProps) {
  const canvas = useCanvas();
  const id = useId();
  const [own, setOwn] = useState(defaultSelected);
  const selected = selectedProp ?? own;
  const [message, setMessage] = useState("");

  // Newly selected nodes come to the front, in the order they were picked
  const [order, setOrder] = useState<string[]>(selected);
  const [prevSelected, setPrevSelected] = useState(selected);
  if (prevSelected !== selected) {
    setPrevSelected(selected);
    const added = selected.filter((x) => !prevSelected.includes(x));
    if (added.length) setOrder((o) => [...o.filter((x) => !added.includes(x)), ...added]);
  }
  const z = useMemo(() => new Map(order.map((x, i) => [x, i + 1])), [order]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const latest = useRef({ positions, selected, onPositionsChange, onSelectedChange, describeMove, controlled: selectedProp != null });
  useLayoutEffect(() => {
    latest.current = { positions, selected, onPositionsChange, onSelectedChange, describeMove, controlled: selectedProp != null };
  });
  const [names] = useState(() => new Map<string, string>());

  const [api] = useState(() => {
    const announce = (m: string) => setMessage((old) => (old === m ? m + " " : m));
    const select = (ids: string[]) => {
      const l = latest.current;
      if (sameIds(ids, l.selected)) return;
      l.selected = ids;
      if (!l.controlled) setOwn(ids);
      l.onSelectedChange?.(ids);
    };
    const change = (next: Record<string, CanvasPoint>, move: CanvasNodeMove) => {
      latest.current.positions = next;
      latest.current.onPositionsChange?.(next, move);
    };
    const announceMove = (ids: string[], next: Record<string, CanvasPoint>) =>
      announce(latest.current.describeMove(ids.map((x) => names.get(x) ?? x), ids.map((x) => next[x])));
    return { announce, select, change, announceMove };
  });

  // A selection box on the background: what it touches, plus what was selected before if additive
  const boxBase = useRef<string[]>([]);
  useEffect(
    () =>
      canvas.onBox((e) => {
        if (e.phase === "start") {
          boxBase.current = e.additive ? latest.current.selected : [];
          return;
        }
        const ours = latest.current.positions;
        const hits = [...canvas.getNodes()].filter(([nid, r]) => nid in ours && rectsIntersect(r, e.rect)).map(([nid]) => nid);
        const next = [...new Set([...boxBase.current, ...hits])];
        api.select(next);
        if (e.phase === "end" && hits.length) api.announce(next.length === 1 ? `${names.get(next[0]) ?? next[0]} selected` : `${next.length} selected`);
      }),
    [canvas, api, names],
  );
  useEffect(() => canvas.onBackgroundClick(() => api.select([])), [canvas, api]);

  const value: NodesContext = {
    positions,
    selected: selectedSet,
    z,
    snap,
    step: keyboardStep ?? (snap || 10),
    autoPan,
    roleDescription,
    descId: `${id}-desc`,
    selId: `${id}-sel`,
    latest,
    names,
    onOpen,
    onDelete,
    ...api,
  };

  return (
    <Ctx value={value}>
      {children}
      <span id={`${id}-sel`} hidden>
        Selected.
      </span>
      <span id={`${id}-desc`} hidden>
        Arrow keys move it, Shift for bigger steps. Space selects it, Enter opens it, Escape clears the selection{onDelete ? ", Delete removes it" : ""}.
        {keyHelp && ` ${keyHelp}`}
      </span>
      <span role="status" className="sr-only">
        {message}
      </span>
    </Ctx>
  );
}

const NO_DRAG = "[data-canvas-nodrag], input, textarea, select, button, a[href], summary, [contenteditable='true'], [contenteditable='']";
const EDGE = 36;

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  /** Canvas px added by auto-panning since the drag began */
  panX: number;
  panY: number;
  ids: string[];
  base: Record<string, CanvasPoint>;
  moved: boolean;
  /** Pressed on a node that was already part of a bigger selection: a click without a drag selects just it */
  reselect: boolean;
  raf: number;
  last: Record<string, CanvasPoint> | null;
}

export interface CanvasNodeProps extends Omit<HTMLAttributes<HTMLDivElement>, "id"> {
  /** The key into CanvasNodes' positions */
  id: string;
  /** Accessible name, with what matters at a glance: "orders table, 9 columns, 3 relations" */
  label: string;
  /** Short name for announcements ("orders moved to 240, 80"). Default the label. */
  name?: string;
  /** Selectable but not draggable */
  locked?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * One draggable thing on a Canvas, inside CanvasNodes: positioned at its entry in `positions`, a
 * tab stop with a name, selected with a 2px frame (and `data-selected`, for your own styling).
 * Its size comes from its content (`w-max`; give it a width to wrap text) and is measured, so fit
 * and the minimap know it. Controls inside
 * (buttons, inputs, and anything marked `data-canvas-nodrag`) work as usual and don't start a drag.
 */
export function CanvasNode({
  id,
  label,
  name,
  locked = false,
  className,
  style,
  children,
  ref,
  onKeyDown,
  onKeyUp,
  onDoubleClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...rest
}: CanvasNodeProps) {
  const n = useNodes();
  const canvas = useCanvas();
  const el = useRef<HTMLDivElement | null>(null);
  const drag = useRef<Drag | null>(null);
  const pos = n.positions[id] ?? { x: 0, y: 0 };
  const isSelected = n.selected.has(id);

  // Tell the canvas where it is and how big; measure again when the content changes size
  const at = useRef(pos);
  useLayoutEffect(() => {
    at.current = pos;
    const e = el.current;
    if (e) canvas.setNode(id, { x: pos.x, y: pos.y, width: e.offsetWidth, height: e.offsetHeight });
  });
  useEffect(() => {
    const e = el.current;
    if (!e) return;
    const ro = new ResizeObserver(() => canvas.setNode(id, { x: at.current.x, y: at.current.y, width: e.offsetWidth, height: e.offsetHeight }));
    ro.observe(e);
    return () => {
      ro.disconnect();
      canvas.removeNode(id);
    };
  }, [canvas, id]);
  useLayoutEffect(() => {
    n.names.set(id, name ?? label);
  }, [n.names, id, name, label]);
  useEffect(() => () => cancelAnimationFrame(drag.current?.raf ?? 0), []);

  const apply = (d: Drag, done: boolean) => {
    const zoom = canvas.getTransform().zoom;
    let dx = (d.lastX - d.startX) / zoom + d.panX;
    let dy = (d.lastY - d.startY) / zoom + d.panY;
    if (n.snap > 0) {
      // Snap the node under the pointer; the others keep their distance to it
      const p = d.base[id] ?? { x: 0, y: 0 };
      dx = Math.round((p.x + dx) / n.snap) * n.snap - p.x;
      dy = Math.round((p.y + dy) / n.snap) * n.snap - p.y;
    }
    const next = { ...n.latest.current.positions };
    for (const x of d.ids) next[x] = { x: d.base[x].x + dx, y: d.base[x].y + dy };
    d.last = next;
    n.change(next, { ids: d.ids, done, source: "pointer" });
  };

  /** While the pointer is near an edge of the canvas, pan towards it, faster the closer it gets */
  const edgePan = () => {
    const d = drag.current;
    const v = canvas.viewport();
    if (!d || !v || !n.autoPan) return;
    const b = v.getBoundingClientRect();
    const speed = (dist: number) => (dist < EDGE ? Math.min(14, ((EDGE - dist) / EDGE) * 14) : 0);
    const vx = speed(d.lastX - b.left) > 0 ? -speed(d.lastX - b.left) : speed(b.right - d.lastX);
    const vy = speed(d.lastY - b.top) > 0 ? -speed(d.lastY - b.top) : speed(b.bottom - d.lastY);
    if (!vx && !vy) {
      d.raf = 0;
      return;
    }
    const zoom = canvas.getTransform().zoom;
    canvas.panBy(-vx, -vy);
    d.panX += vx / zoom;
    d.panY += vy / zoom;
    apply(d, false);
    d.raf = requestAnimationFrame(edgePan);
  };

  const finish = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    cancelAnimationFrame(d.raf);
    drag.current = null;
    if (d.moved && d.last) {
      n.change(d.last, { ids: d.ids, done: true, source: "pointer" });
      n.announceMove(d.ids, d.last);
    } else if (d.reselect && e.type === "pointerup") n.select([id]);
  };

  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="canvas-node"
      data-canvas-node={id}
      data-selected={isSelected || undefined}
      role="group"
      aria-roledescription={n.roleDescription}
      aria-label={label}
      aria-describedby={isSelected ? `${n.selId} ${n.descId}` : n.descId}
      tabIndex={0}
      className={cn("absolute w-max touch-none", !locked && "cursor-move", FOCUS_RING, "focus-visible:outline-offset-3", className)}
      style={{ left: pos.x, top: pos.y, zIndex: n.z.get(id), ...style }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (e.defaultPrevented || e.button !== 0 || canvas.spaceHeld()) return;
        if ((e.target as Element).closest(NO_DRAG)) return;
        const sel = n.latest.current.selected;
        const was = sel.includes(id);
        let ids: string[];
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (was) return n.select(sel.filter((x) => x !== id));
          ids = [...sel, id];
          n.select(ids);
        } else if (!was) {
          ids = [id];
          n.select(ids);
        } else ids = sel;
        if (locked) return;
        const positions = n.latest.current.positions;
        drag.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          panX: 0,
          panY: 0,
          ids: ids.filter((x) => positions[x]),
          base: Object.fromEntries(ids.filter((x) => positions[x]).map((x) => [x, positions[x]])),
          moved: false,
          reselect: was && sel.length > 1 && !(e.shiftKey || e.metaKey || e.ctrlKey),
          raf: 0,
          last: null,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const d = drag.current;
        if (!d || d.pointerId !== e.pointerId) return;
        // A second finger turned this into a pinch: the canvas has it now
        if (canvas.pinching()) {
          cancelAnimationFrame(d.raf);
          drag.current = null;
          if (d.moved && d.last) n.change(d.last, { ids: d.ids, done: true, source: "pointer" });
          return;
        }
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        if (!d.moved && Math.hypot(d.lastX - d.startX, d.lastY - d.startY) < 4) return;
        d.moved = true;
        apply(d, false);
        if (!d.raf) d.raf = requestAnimationFrame(edgePan);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        finish(e);
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        finish(e);
      }}
      onDoubleClick={(e) => {
        onDoubleClick?.(e);
        if (!e.defaultPrevented && !(e.target as Element).closest(NO_DRAG)) n.onOpen?.(id);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || e.target !== e.currentTarget) return;
        const sel = n.latest.current.selected;
        const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (arrows[e.key] && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (locked) return;
          const ids = sel.includes(id) ? sel : [id];
          if (!sel.includes(id)) n.select(ids);
          const step = n.step * (e.shiftKey ? 10 : 1);
          const [sx, sy] = arrows[e.key];
          const next = { ...n.latest.current.positions };
          for (const x of ids) if (next[x]) next[x] = { x: next[x].x + sx * step, y: next[x].y + sy * step };
          n.change(next, { ids, done: true, source: "keyboard" });
          n.announceMove(ids, next);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (!sel.includes(id)) n.select([id]);
          n.onOpen?.(id);
        } else if (e.key === "Escape" && sel.length) {
          e.preventDefault();
          n.select([]);
          n.announce("Selection cleared");
        } else if ((e.key === "Delete" || e.key === "Backspace") && n.onDelete) {
          e.preventDefault();
          n.onDelete(sel.includes(id) ? sel : [id]);
        } else if (e.key.toLowerCase() === "a" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          const all = Object.keys(n.latest.current.positions);
          n.select(all);
          n.announce(`${all.length} selected`);
        }
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e);
        // A tap on Space selects; Space held while dragging panned the canvas instead
        if (e.defaultPrevented || e.target !== e.currentTarget || e.key !== " " || canvas.spacePanned()) return;
        const sel = n.latest.current.selected;
        const on = sel.includes(id);
        n.select(on ? sel.filter((x) => x !== id) : [...sel, id]);
        n.announce(`${name ?? label} ${on ? "deselected" : "selected"}`);
      }}
      {...rest}
    >
      {children}
      {isSelected && <span aria-hidden data-slot="canvas-node-selection" className="pointer-events-none absolute -inset-[3px] border-2 border-ring" />}
    </div>
  );
}
