"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Scan, ZoomIn, ZoomOut } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { cn } from "@/lib/utils";

/** Where the canvas is looking: a point on screen is `world × zoom + (x, y)`, in px from the canvas's top left corner. */
export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What dragging the empty background does: pan the view (the default), or draw a selection box */
export type CanvasTool = "pan" | "select";

/** A selection box being drawn, in canvas coordinates */
export interface CanvasBoxEvent {
  rect: CanvasRect;
  /** Add to the selection rather than replace it (Shift in the select tool, Ctrl or ⌘ in either) */
  additive: boolean;
  phase: "start" | "move" | "end";
}

/** What a canvas can be told to do from outside, through `canvasRef`, and from inside, through useCanvas() */
export interface CanvasHandle {
  /** Zoom and pan so `rect` (default: every node, or `bounds`) fills the view, at most at `maxZoom` (default 1) */
  fit: (options?: { rect?: CanvasRect; padding?: number; maxZoom?: number; animate?: boolean }) => void;
  /** Zoom to a level, keeping the point `around` (px in the canvas; default its centre) still */
  zoomTo: (zoom: number, options?: { around?: CanvasPoint; animate?: boolean }) => void;
  /** Multiply the zoom, e.g. 1.2 in, 1 / 1.2 out */
  zoomBy: (factor: number, options?: { around?: CanvasPoint; animate?: boolean }) => void;
  /** Back to 100%, keeping the centre */
  reset: (options?: { animate?: boolean }) => void;
  /** Move the view by screen pixels */
  panBy: (dx: number, dy: number) => void;
  /** Bring a rect to the middle of the view, at `zoom` (default: the current zoom) */
  centerOn: (rect: CanvasRect | CanvasPoint, options?: { zoom?: number; animate?: boolean }) => void;
  getTransform: () => CanvasTransform;
  setTransform: (t: CanvasTransform, options?: { animate?: boolean }) => void;
  /** The part of the canvas in view, in canvas coordinates */
  getVisibleRect: () => CanvasRect;
  /** A pointer position (clientX, clientY) in canvas coordinates */
  toCanvas: (clientX: number, clientY: number) => CanvasPoint;
  /** Every registered node's rect, by id, in canvas coordinates */
  getNodes: () => ReadonlyMap<string, CanvasRect>;
}

/** Everything inside a Canvas can reach it through useCanvas(): the handle, plus what nodes and overlays need. */
export interface CanvasApi extends CanvasHandle {
  subscribe: (listener: () => void) => () => void;
  getSize: () => { width: number; height: number };
  /** Nodes say where they are and how big, so fit, the minimap and the selection box know about them */
  setNode: (id: string, rect: CanvasRect) => void;
  removeNode: (id: string) => void;
  onBox: (handler: (e: CanvasBoxEvent) => void) => () => void;
  onBackgroundClick: (handler: () => void) => () => void;
  /** Space is held: a drag anywhere pans, so nodes should not start their own drag */
  spaceHeld: () => boolean;
  /** The view was panned while Space was held down (so letting go of Space was not a key press) */
  spacePanned: () => boolean;
  /** Two fingers are on the canvas: a pinch, which takes over from any node drag */
  pinching: () => boolean;
  viewport: () => HTMLDivElement | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sameRect = (a: CanvasRect | undefined, b: CanvasRect) => !!a && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/** The smallest rect holding all of them, or null for none */
export function unionRect(rects: Iterable<CanvasRect>): CanvasRect | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.width);
    y1 = Math.max(y1, r.y + r.height);
  }
  return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** Do two rects overlap at all? */
export function rectsIntersect(a: CanvasRect, b: CanvasRect) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/**
 * The state that changes many times a second (the transform while panning, node rects while
 * dragging) lives outside React: the world layer is moved by writing its style directly, and only
 * what shows the numbers (the zoom level, the minimap) subscribes to it. Panning a big diagram
 * never re-renders the diagram.
 */
function createStore(transform: CanvasTransform) {
  let t = transform;
  let size = { width: 0, height: 0 };
  let nodes: ReadonlyMap<string, CanvasRect> = new Map();
  const listeners = new Set<() => void>();
  let queued = false;
  const emit = () => listeners.forEach((l) => l());
  // Many nodes report at once (on mount, while a group is dragged): tell listeners once.
  const emitSoon = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      emit();
    });
  };
  return {
    getTransform: () => t,
    setTransform(next: CanvasTransform) {
      if (next.x === t.x && next.y === t.y && next.zoom === t.zoom) return;
      t = next;
      emit();
    },
    getSize: () => size,
    setSize(next: { width: number; height: number }) {
      if (next.width === size.width && next.height === size.height) return;
      size = next;
      emit();
    },
    getNodes: () => nodes,
    setNode(id: string, rect: CanvasRect) {
      if (sameRect(nodes.get(id), rect)) return;
      const m = new Map(nodes);
      m.set(id, rect);
      nodes = m;
      emitSoon();
    },
    removeNode(id: string) {
      if (!nodes.has(id)) return;
      const m = new Map(nodes);
      m.delete(id);
      nodes = m;
      emitSoon();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

const CanvasContext = createContext<CanvasApi | null>(null);

/** The canvas around this component: its handle, its nodes, its events. Throws outside a Canvas. */
export function useCanvas(): CanvasApi {
  const api = useContext(CanvasContext);
  if (!api) throw new Error("useCanvas must be used inside <Canvas>");
  return api;
}

const IDENTITY: CanvasTransform = { x: 0, y: 0, zoom: 1 };
const NO_NODES: ReadonlyMap<string, CanvasRect> = new Map();
const NO_SIZE = { width: 0, height: 0 };

/** The current transform, re-rendering on every change (a zoom readout, a minimap) */
export function useCanvasTransform(): CanvasTransform {
  const c = useCanvas();
  return useSyncExternalStore(c.subscribe, c.getTransform, () => IDENTITY);
}

/** Every registered node's rect, in canvas coordinates */
export function useCanvasNodeRects(): ReadonlyMap<string, CanvasRect> {
  const c = useCanvas();
  return useSyncExternalStore(c.subscribe, c.getNodes, () => NO_NODES);
}

/** The canvas's own size on screen, px */
export function useCanvasSize(): { width: number; height: number } {
  const c = useCanvas();
  return useSyncExternalStore(c.subscribe, c.getSize, () => NO_SIZE);
}

const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const PRESSABLE = `${EDITABLE}, button, a[href], summary`;

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Paint the grid as a background on the canvas itself, so it is one element at any zoom. */
function paintGrid(el: HTMLElement, t: CanvasTransform, grid: "dots" | "lines" | "none", size: number) {
  const s = el.style;
  if (grid === "none" || size <= 0) {
    s.backgroundImage = "";
    return;
  }
  // Zoomed far out the grid would be a grey wash: skip to every 2nd, 4th... line instead.
  let step = size * t.zoom;
  while (step < 10) step *= 2;
  if (grid === "dots") {
    const r = clamp(t.zoom, 0.6, 1.25);
    s.backgroundImage = `radial-gradient(circle, var(--color-border) ${r}px, transparent ${r + 0.3}px)`;
    s.backgroundSize = `${step}px ${step}px`;
    s.backgroundPosition = `${t.x - step / 2}px ${t.y - step / 2}px`;
  } else {
    const c = "color-mix(in oklch, var(--color-border) 55%, transparent)";
    s.backgroundImage = `linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px)`;
    s.backgroundSize = `${step}px ${step}px`;
    s.backgroundPosition = `${t.x}px ${t.y}px`;
  }
}

type Gesture =
  | { kind: "pan"; id: number; lastX: number; lastY: number; startX: number; startY: number; moved: boolean; click: boolean }
  | { kind: "box"; id: number; startX: number; startY: number; additive: boolean; moved: boolean }
  | { kind: "pinch"; dist: number; mid: CanvasPoint; start: CanvasTransform };

interface CanvasSettings {
  transform?: CanvasTransform;
  onTransformChange?: (t: CanvasTransform) => void;
  minZoom: number;
  maxZoom: number;
  grid: "dots" | "lines" | "none";
  gridSize: number;
  tool: CanvasTool;
  bounds?: CanvasRect;
  fitPadding: number;
  onBackgroundClick?: () => void;
}

interface LiveState {
  gesture: Gesture | null;
  touches: Map<number, CanvasPoint>;
  space: boolean;
  spacePanned: boolean;
  hover: boolean;
  anim: number;
  /** Where a running animation is heading, so a second zoom click builds on it */
  target: CanvasTransform | null;
  gestureZoom: number;
  boxHandlers: Set<(e: CanvasBoxEvent) => void>;
  clickHandlers: Set<() => void>;
}

interface EngineRefs {
  viewport: RefObject<HTMLDivElement | null>;
  world: RefObject<HTMLDivElement | null>;
  props: RefObject<CanvasSettings>;
  live: RefObject<LiveState>;
}

/**
 * The canvas's behaviour, made once per canvas. It reaches the elements, the latest props and the
 * gesture state through refs handed over by `bind` when the canvas mounts; nothing here runs
 * during render.
 */
function createEngine(initial: CanvasTransform) {
  const store = createStore(initial);
  let r: EngineRefs | null = null;
  const viewport = { get current() { return r?.viewport.current ?? null; } };
  const world = { get current() { return r?.world.current ?? null; } };
  const props = { get current() { return r!.props.current; } };
  const live = { get current() { return r!.live.current; } };
  const bind = (refs: EngineRefs) => {
    r = refs;
  };
  const apply = (t: CanvasTransform) => {
    const w = world.current;
    if (w) w.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.zoom})`;
    if (viewport.current) paintGrid(viewport.current, t, props.current.grid, props.current.gridSize);
  };
  const normal = (t: CanvasTransform): CanvasTransform => ({ ...t, zoom: clamp(t.zoom, props.current.minZoom, props.current.maxZoom) });
  /** Every change goes through here: controlled, it only asks; uncontrolled, it moves the layer at once. */
  const commit = (next: CanvasTransform) => {
    const t = normal(next);
    const p = props.current;
    if (p.transform) {
      p.onTransformChange?.(t);
      return;
    }
    store.setTransform(t);
    apply(t);
    p.onTransformChange?.(t);
  };
  const stop = () => {
    cancelAnimationFrame(live.current.anim);
    live.current.anim = 0;
    live.current.target = null;
  };
  /** Animate along the straight line between the two view centres, zooming geometrically, so it reads as one move. */
  const go = (target: CanvasTransform, animate = false) => {
    stop();
    const to = normal(target);
    const from = store.getTransform();
    const { width, height } = store.getSize();
    if (!animate || reducedMotion() || !width) return commit(to);
    const centre = (t: CanvasTransform) => ({ x: (width / 2 - t.x) / t.zoom, y: (height / 2 - t.y) / t.zoom });
    const c0 = centre(from);
    const c1 = centre(to);
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / 280);
      const e = 1 - Math.pow(1 - p, 3);
      const zoom = from.zoom * Math.pow(to.zoom / from.zoom, e);
      const cx = c0.x + (c1.x - c0.x) * e;
      const cy = c0.y + (c1.y - c0.y) * e;
      commit({ zoom, x: width / 2 - cx * zoom, y: height / 2 - cy * zoom });
      if (p < 1) live.current.anim = requestAnimationFrame(frame);
      else stop();
    };
    live.current.target = to;
    live.current.anim = requestAnimationFrame(frame);
  };
  /** The transform to build on: where a running animation is heading, else where the view is */
  const base = () => live.current.target ?? store.getTransform();
  const centreOfView = () => {
    const { width, height } = store.getSize();
    return { x: width / 2, y: height / 2 };
  };
  const zoomAround = (zoom: number, around: CanvasPoint, from = store.getTransform()): CanvasTransform => {
    const z = clamp(zoom, props.current.minZoom, props.current.maxZoom);
    const wx = (around.x - from.x) / from.zoom;
    const wy = (around.y - from.y) / from.zoom;
    return { zoom: z, x: around.x - wx * z, y: around.y - wy * z };
  };
  const contentRect = () => props.current.bounds ?? unionRect(store.getNodes().values());

  const api: CanvasApi = {
    subscribe: store.subscribe,
    getSize: store.getSize,
    getNodes: store.getNodes,
    setNode: store.setNode,
    removeNode: store.removeNode,
    getTransform: store.getTransform,
    setTransform: (t, o) => go(t, o?.animate),
    fit: (o = {}) => {
      const r = o.rect ?? contentRect();
      const { width, height } = store.getSize();
      if (!r || !width || !height) return;
      const pad = o.padding ?? props.current.fitPadding;
      const zoom = clamp(
        Math.min((width - pad * 2) / Math.max(r.width, 1), (height - pad * 2) / Math.max(r.height, 1)),
        props.current.minZoom,
        Math.min(props.current.maxZoom, o.maxZoom ?? 1),
      );
      go({ zoom, x: (width - r.width * zoom) / 2 - r.x * zoom, y: (height - r.height * zoom) / 2 - r.y * zoom }, o.animate);
    },
    zoomTo: (zoom, o = {}) => {
      const b = base();
      go(zoomAround(zoom, o.around ?? centreOfView(), b), o.animate);
    },
    zoomBy: (factor, o = {}) => {
      const b = base();
      go(zoomAround(b.zoom * factor, o.around ?? centreOfView(), b), o.animate);
    },
    reset: (o = {}) => go(zoomAround(1, centreOfView(), base()), o.animate),
    panBy: (dx, dy) => {
      stop();
      const t = store.getTransform();
      commit({ ...t, x: t.x + dx, y: t.y + dy });
    },
    centerOn: (r, o = {}) => {
      const { width, height } = store.getSize();
      const zoom = clamp(o.zoom ?? base().zoom, props.current.minZoom, props.current.maxZoom);
      const cx = "width" in r ? r.x + r.width / 2 : r.x;
      const cy = "height" in r ? r.y + r.height / 2 : r.y;
      go({ zoom, x: width / 2 - cx * zoom, y: height / 2 - cy * zoom }, o.animate);
    },
    getVisibleRect: () => {
      const t = store.getTransform();
      const { width, height } = store.getSize();
      return { x: -t.x / t.zoom, y: -t.y / t.zoom, width: width / t.zoom, height: height / t.zoom };
    },
    toCanvas: (clientX, clientY) => {
      const b = viewport.current?.getBoundingClientRect();
      const t = store.getTransform();
      return { x: (clientX - (b?.left ?? 0) - t.x) / t.zoom, y: (clientY - (b?.top ?? 0) - t.y) / t.zoom };
    },
    onBox: (h) => {
      live.current.boxHandlers.add(h);
      return () => live.current.boxHandlers.delete(h);
    },
    onBackgroundClick: (h) => {
      live.current.clickHandlers.add(h);
      return () => live.current.clickHandlers.delete(h);
    },
    spaceHeld: () => live.current.space,
    spacePanned: () => live.current.spacePanned,
    pinching: () => live.current.gesture?.kind === "pinch",
    viewport: () => viewport.current,
  };
  return { api, store, bind, apply, commit, stop, zoomAround };
}

export interface CanvasProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** Accessible name: "Database diagram", "Floor plan" */
  label: string;
  /** Controlled transform; leave out to let the canvas keep its own */
  transform?: CanvasTransform;
  /** Where it starts when uncontrolled: a transform, or "fit" to show every node */
  defaultTransform?: CanvasTransform | "fit";
  /** Called on every pan and zoom (many times a second while dragging) */
  onTransformChange?: (t: CanvasTransform) => void;
  /** Default 0.1 (10%) */
  minZoom?: number;
  /** Default 4 (400%) */
  maxZoom?: number;
  /** Background grid, drawn in the border colour; it moves and scales with the content. Default dots. */
  grid?: "dots" | "lines" | "none";
  /** Grid spacing in canvas px. Default 20; pass the same number to CanvasNodes' `snap` so nodes land on it. */
  gridSize?: number;
  /** What dragging the empty background does. Default pan; Shift+drag draws a selection box either way. */
  tool?: CanvasTool;
  /** What "fit" shows, if not every node */
  bounds?: CanvasRect;
  /** Room around the content when fitting, px. Default 40. */
  fitPadding?: number;
  /** Fixed to the canvas, on top, not moved by panning: CanvasControls, a CanvasMinimap, a legend. Position them yourself (`absolute right-2 bottom-2`). */
  overlay?: ReactNode;
  /** A click (no drag) on the empty background */
  onBackgroundClick?: () => void;
  /** fit(), zoomTo(), centerOn()... from outside */
  canvasRef?: Ref<CanvasHandle>;
  /**
   * Content in canvas coordinates: position children absolutely (CanvasNode does it for you). The
   * layer they sit on has no size, so give text a width or `w-max`, or it wraps at every word.
   */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * An endless surface you pan and zoom, for diagrams, boards and floor plans. Children sit in canvas
 * coordinates (absolutely positioned) on a layer that moves and scales as one; `overlay` stays put
 * on top. Give it a size (`h-96`, `flex-1`).
 *
 * Pointer: drag the background to pan (or draw a selection box with the select tool, or Shift+drag
 * with either); the wheel or a trackpad scrolls; Ctrl or ⌘ + wheel, or a trackpad pinch, zooms
 * around the pointer; hold Space and drag to pan from anywhere, as in design tools; the middle
 * button pans too. Touch: one finger pans, two pinch. Keyboard, with the canvas focused: arrow keys
 * pan (Shift for bigger steps), + and − zoom, 0 goes to 100%, 1 fits everything.
 *
 * The transform is controlled (`transform` + `onTransformChange`) or not (`defaultTransform`,
 * "fit" to start with everything in view). `canvasRef` gives fit(), zoomTo(), centerOn() and the
 * rest; animated moves are instant when reduced motion is asked for.
 */
export function Canvas({
  label,
  transform,
  defaultTransform = IDENTITY,
  onTransformChange,
  minZoom = 0.1,
  maxZoom = 4,
  grid = "dots",
  gridSize = 20,
  tool = "pan",
  bounds,
  fitPadding = 40,
  overlay,
  onBackgroundClick,
  canvasRef,
  className,
  children,
  ref,
  onKeyDown,
  ...rest
}: CanvasProps) {
  const [engine] = useState(() => createEngine(transform ?? (defaultTransform === "fit" ? IDENTITY : defaultTransform)));
  const { api, store } = engine;
  const viewport = useRef<HTMLDivElement | null>(null);
  const world = useRef<HTMLDivElement | null>(null);
  const descId = useId();
  const [box, setBox] = useState<CanvasRect | null>(null);

  const props = useRef<CanvasSettings>({ transform, onTransformChange, minZoom, maxZoom, grid, gridSize, tool, bounds, fitPadding, onBackgroundClick });
  useLayoutEffect(() => {
    props.current = { transform, onTransformChange, minZoom, maxZoom, grid, gridSize, tool, bounds, fitPadding, onBackgroundClick };
  });

  // Mutable gesture state, shared by the handlers below and the api
  const live = useRef<LiveState>({
    gesture: null as Gesture | null,
    touches: new Map<number, CanvasPoint>(),
    space: false,
    spacePanned: false,
    hover: false,
    anim: 0,
    target: null,
    gestureZoom: 0,
    boxHandlers: new Set<(e: CanvasBoxEvent) => void>(),
    clickHandlers: new Set<() => void>(),
  });

  // First of the layout effects, so everything after (and every handler) can use the engine
  useLayoutEffect(() => engine.bind({ viewport, world, props, live }), [engine]);

  useImperativeHandle(canvasRef, () => api, [api]);

  // Controlled: follow the prop
  const tx = transform?.x;
  const ty = transform?.y;
  const tz = transform?.zoom;
  useLayoutEffect(() => {
    if (tx == null || ty == null || tz == null) return;
    store.setTransform({ x: tx, y: ty, zoom: tz });
    engine.apply(store.getTransform());
  }, [tx, ty, tz, store, engine]);

  // Repaint the grid when its settings change
  useLayoutEffect(() => {
    if (viewport.current) paintGrid(viewport.current, store.getTransform(), grid, gridSize);
  }, [grid, gridSize, store]);

  // Size, first transform, and the first fit (once nodes have registered and measured)
  useLayoutEffect(() => {
    const v = viewport.current;
    const w = world.current;
    if (!v || !w) return;
    store.setSize({ width: v.clientWidth, height: v.clientHeight });
    engine.apply(store.getTransform());
    const ro = new ResizeObserver(() => store.setSize({ width: v.clientWidth, height: v.clientHeight }));
    ro.observe(v);
    let raf = 0;
    if (defaultTransform === "fit" && !props.current.transform) {
      // A frame later: positions restored from storage right after hydration are in by then.
      raf = requestAnimationFrame(() => {
        api.fit();
        w.style.visibility = "visible";
      });
    } else w.style.visibility = "visible";
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
    // Mount only: a later change of defaultTransform is ignored, as with any default
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel (non-passive, so the page doesn't scroll or zoom), Safari's trackpad pinch, and Space
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const l = live.current;
    const point = (e: { clientX: number; clientY: number }) => {
      const b = v.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onWheel = (e: WheelEvent) => {
      const target = e.target as Element;
      // A scrolling panel in the overlay (a legend, a list) scrolls itself
      if (target.closest("[data-canvas-overlay] *")) return;
      e.preventDefault();
      engine.stop();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? v.clientHeight : 1;
      const t = api.getTransform();
      if (e.ctrlKey || e.metaKey) {
        if (l.gestureZoom) return;
        // Trackpad pinches arrive as small ctrl+wheel steps that match the pinch exactly at /100; a
        // mouse wheel's 100px notches are capped so one notch is about 25%.
        const d = clamp(e.deltaY * unit, -30, 30);
        engine.commit(engine.zoomAround(t.zoom * Math.exp(-d / 100), point(e)));
      } else {
        let dx = e.deltaX * unit;
        let dy = e.deltaY * unit;
        if (e.shiftKey && dx === 0) [dx, dy] = [dy, 0];
        engine.commit({ ...t, x: t.x - dx, y: t.y - dy });
      }
    };
    type GestureEvt = Event & { scale: number; clientX: number; clientY: number };
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      l.gestureZoom = api.getTransform().zoom;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as GestureEvt;
      engine.commit(engine.zoomAround(l.gestureZoom * g.scale, point(g)));
    };
    const onGestureEnd = (e: Event) => {
      e.preventDefault();
      l.gestureZoom = 0;
    };
    const active = () => l.hover || v.contains(document.activeElement);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.code !== "Space") return;
      if (e.type === "keyup") {
        if (l.space) {
          l.space = false;
          delete v.dataset.space;
        }
        return;
      }
      const target = e.target as Element | null;
      if (!active() || target?.closest?.(PRESSABLE)) return;
      e.preventDefault();
      if (e.repeat || l.space) return;
      l.space = true;
      l.spacePanned = false;
      v.dataset.space = "";
    };
    const onBlur = () => {
      l.space = false;
      delete v.dataset.space;
    };
    v.addEventListener("wheel", onWheel, { passive: false });
    const gestures = "GestureEvent" in window;
    if (gestures) {
      v.addEventListener("gesturestart", onGestureStart);
      v.addEventListener("gesturechange", onGestureChange);
      v.addEventListener("gestureend", onGestureEnd);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      v.removeEventListener("wheel", onWheel);
      if (gestures) {
        v.removeEventListener("gesturestart", onGestureStart);
        v.removeEventListener("gesturechange", onGestureChange);
        v.removeEventListener("gestureend", onGestureEnd);
      }
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
      cancelAnimationFrame(l.anim);
    };
  }, [api, engine]);

  const local = (e: { clientX: number; clientY: number }) => {
    const b = viewport.current!.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const toWorldRect = (a: CanvasPoint, b: CanvasPoint): CanvasRect => {
    const t = api.getTransform();
    const x0 = (Math.min(a.x, b.x) - t.x) / t.zoom;
    const y0 = (Math.min(a.y, b.y) - t.y) / t.zoom;
    return { x: x0, y: y0, width: Math.abs(a.x - b.x) / t.zoom, height: Math.abs(a.y - b.y) / t.zoom };
  };
  const emitBox = (e: CanvasBoxEvent) => live.current.boxHandlers.forEach((h) => h(e));
  const backgroundClick = () => {
    live.current.clickHandlers.forEach((h) => h());
    props.current.onBackgroundClick?.();
  };
  const setPanning = (on: boolean) => {
    if (!viewport.current) return;
    if (on) viewport.current.dataset.panning = "";
    else delete viewport.current.dataset.panning;
  };
  /** Capture the pointer only once it moves: a capture from the start would send the click to the canvas, not to what was clicked (a line) */
  const capture = (id: number) => {
    try {
      viewport.current?.setPointerCapture(id);
    } catch {
      // The pointer is already gone
    }
  };
  const startPan = (e: ReactPointerEvent, click: boolean) => {
    live.current.gesture = { kind: "pan", id: e.pointerId, lastX: e.clientX, lastY: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, click };
    setPanning(true);
  };
  const startPinch = () => {
    const [a, b] = [...live.current.touches.values()];
    const v = viewport.current!.getBoundingClientRect();
    live.current.gesture = {
      kind: "pinch",
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mid: { x: (a.x + b.x) / 2 - v.left, y: (a.y + b.y) / 2 - v.top },
      start: api.getTransform(),
    };
    for (const id of live.current.touches.keys()) capture(id);
  };

  const onPointerDownCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const l = live.current;
    engine.stop();
    if ((e.target as Element).closest("[data-canvas-overlay] *")) return;
    if (e.pointerType === "touch") {
      l.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (l.touches.size === 2) {
        e.stopPropagation();
        if (l.gesture?.kind === "box") emitBox({ rect: { x: 0, y: 0, width: 0, height: 0 }, additive: true, phase: "end" });
        setBox(null);
        startPinch();
        return;
      }
    }
    // Space+drag and the middle button pan from anywhere, nodes included
    if ((l.space && e.button === 0) || e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      if (l.space) l.spacePanned = true;
      startPan(e, false);
      capture(e.pointerId);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const l = live.current;
    if (l.gesture || e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest("[data-canvas-overlay] *, [data-canvas-node]") || target.closest(PRESSABLE)) return;
    const p = props.current;
    if (p.tool === "select" || e.shiftKey) {
      const at = local(e);
      l.gesture = { kind: "box", id: e.pointerId, startX: at.x, startY: at.y, additive: e.ctrlKey || e.metaKey || (p.tool === "select" && e.shiftKey), moved: false };
      emitBox({ rect: toWorldRect(at, at), additive: l.gesture.additive, phase: "start" });
    } else startPan(e, !target.closest("[data-canvas-interactive]"));
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const l = live.current;
    if (l.touches.has(e.pointerId)) l.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = l.gesture;
    if (!g) return;
    if (g.kind === "pinch") {
      const pts = [...l.touches.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const v = viewport.current!.getBoundingClientRect();
      const mid = { x: (a.x + b.x) / 2 - v.left, y: (a.y + b.y) / 2 - v.top };
      const scale = Math.hypot(a.x - b.x, a.y - b.y) / g.dist;
      // Zoom around where the fingers started, then move with them
      const z = engine.zoomAround(g.start.zoom * scale, g.mid, g.start);
      engine.commit({ zoom: z.zoom, x: z.x + mid.x - g.mid.x, y: z.y + mid.y - g.mid.y });
    } else if (g.kind === "pan" && g.id === e.pointerId) {
      const dx = e.clientX - g.lastX;
      const dy = e.clientY - g.lastY;
      g.lastX = e.clientX;
      g.lastY = e.clientY;
      if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 3) {
        g.moved = true;
        capture(g.id);
      }
      if (g.moved) api.panBy(dx, dy);
    } else if (g.kind === "box" && g.id === e.pointerId) {
      const at = local(e);
      if (!g.moved && Math.hypot(at.x - g.startX, at.y - g.startY) > 3) {
        g.moved = true;
        capture(g.id);
      }
      if (!g.moved) return;
      const start = { x: g.startX, y: g.startY };
      setBox({ x: Math.min(at.x, start.x), y: Math.min(at.y, start.y), width: Math.abs(at.x - start.x), height: Math.abs(at.y - start.y) });
      emitBox({ rect: toWorldRect(start, at), additive: g.additive, phase: "move" });
    }
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const l = live.current;
    l.touches.delete(e.pointerId);
    const g = l.gesture;
    if (!g) return;
    if (g.kind === "pinch") {
      // One finger left: carry on panning with it
      const rest = [...l.touches.entries()];
      if (rest.length === 1) {
        const [id, p] = rest[0];
        l.gesture = { kind: "pan", id, lastX: p.x, lastY: p.y, startX: p.x, startY: p.y, moved: true, click: false };
      } else if (rest.length === 0) {
        l.gesture = null;
        setPanning(false);
      }
      return;
    }
    if (g.id !== e.pointerId) return;
    l.gesture = null;
    setPanning(false);
    if (g.kind === "pan") {
      if (!g.moved && g.click && e.type === "pointerup") backgroundClick();
    } else {
      const at = local(e);
      emitBox({ rect: toWorldRect({ x: g.startX, y: g.startY }, at), additive: g.additive, phase: "end" });
      setBox(null);
      if (!g.moved && !g.additive && e.type === "pointerup") backgroundClick();
    }
  };

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    const step = e.shiftKey ? 200 : 50;
    const pan: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (pan[e.key]) {
      e.preventDefault();
      api.panBy(...pan[e.key]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      api.zoomBy(1.25, { animate: true });
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      api.zoomBy(1 / 1.25, { animate: true });
    } else if (e.key === "0") {
      e.preventDefault();
      api.reset({ animate: true });
    } else if (e.key === "1") {
      e.preventDefault();
      api.fit({ animate: true });
    }
  };

  return (
    <CanvasContext value={api}>
      <div
        ref={(node) => {
          viewport.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="canvas"
        data-tool={tool}
        role="region"
        aria-roledescription="canvas"
        aria-label={label}
        aria-describedby={descId}
        tabIndex={0}
        className={cn(
          "relative isolate touch-none overflow-hidden bg-background select-none [-webkit-user-select:none]",
          tool === "pan" ? "cursor-grab" : "cursor-default",
          "data-[space]:cursor-grab data-[space]:**:cursor-grab! data-[panning]:cursor-grabbing data-[panning]:**:cursor-grabbing!",
          FOCUS_RING,
          "focus-visible:-outline-offset-2",
          className,
        )}
        onPointerDownCapture={onPointerDownCapture}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerEnter={() => {
          live.current.hover = true;
        }}
        onPointerLeave={() => {
          live.current.hover = false;
        }}
        onKeyDown={onKey}
        {...rest}
      >
        <span id={descId} className="sr-only">
          Arrow keys pan, plus and minus zoom, 0 shows 100%, 1 fits everything. Hold Space and drag to pan from anywhere.
        </span>
        <div ref={world} data-canvas-world className="invisible absolute top-0 left-0 size-0 origin-top-left">
          {children}
        </div>
        {box && (
          <div
            aria-hidden
            data-slot="canvas-selection-box"
            className="pointer-events-none absolute border border-ring bg-ring/8"
            style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
          />
        )}
        {overlay != null && (
          <div data-canvas-overlay className="pointer-events-none absolute inset-0 cursor-auto [&>*]:pointer-events-auto">
            {overlay}
          </div>
        )}
      </div>
    </CanvasContext>
  );
}

export interface CanvasControlsProps {
  /** Default sm */
  size?: ControlSize;
  /** Leave out the Fit button */
  noFit?: boolean;
  className?: string;
}

/**
 * Zoom out, the zoom level (a button back to 100%), zoom in, and fit to screen, in one strip. Put it
 * in a Canvas's `overlay`. The keys are named in the buttons' titles.
 */
export function CanvasControls({ size = "sm", noFit = false, className }: CanvasControlsProps) {
  const c = useCanvas();
  const t = useCanvasTransform();
  const pct = Math.round(t.zoom * 100);
  return (
    <ButtonGroup label="Zoom" size={size} className={cn("bg-background", className)}>
      <IconButton icon={ZoomOut} label="Zoom out (−)" onClick={() => c.zoomBy(1 / 1.25, { animate: true })} />
      <Button onClick={() => c.reset({ animate: true })} title="Zoom to 100% (0)" aria-label={`Zoom ${pct}%, reset to 100%`} className="w-[5ch] justify-center px-0 tabular-nums">
        {pct}%
      </Button>
      <IconButton icon={ZoomIn} label="Zoom in (+)" onClick={() => c.zoomBy(1.25, { animate: true })} />
      {!noFit && <IconButton icon={Scan} label="Fit to screen (1)" onClick={() => c.fit({ animate: true })} />}
    </ButtonGroup>
  );
}
