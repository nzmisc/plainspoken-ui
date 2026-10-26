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
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react";
import { GripHorizontal, GripVertical } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export type ResizableDirection = "horizontal" | "vertical";

/** A panel's limits as read from its DOM node, in percent of the group */
interface PanelLimits {
  id: string;
  defaultSize?: number;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
  collapsedSize: number;
}

interface Layout {
  panels: PanelLimits[];
  /** Percent of the group's room, one per panel, summing to 100 */
  sizes: number[];
  /** Handle id → index of the panel before it */
  handles: Record<string, number>;
}

interface GroupContext {
  direction: ResizableDirection;
  layout: Layout | null;
  /** Set panel i's size, the panel after it giving or taking the difference */
  resizePair: (i: number, target: number, from?: number[]) => void;
  /** Collapse or restore whichever of panels i and i+1 is collapsible */
  toggle: (i: number) => void;
  /** Set one panel's size by its index, taking the room from a neighbour */
  resizePanel: (index: number, size: number) => void;
  collapsePanel: (index: number, collapse: boolean) => void;
  /** Write the layout to storage and tell onLayout: after a drag ends, a key, a toggle */
  commit: () => void;
  /** The room panels share, in px (the group less its handles) */
  room: () => number;
}

const Ctx = createContext<GroupContext | null>(null);

function useGroup(part: string) {
  const g = useContext(Ctx);
  if (!g) throw new Error(`${part} must be inside a ResizablePanelGroup`);
  return g;
}

const EPS = 0.01;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
const round = (n: number) => Math.round(n * 100) / 100;
const lowest = (p: PanelLimits) => (p.collapsible ? p.collapsedSize : p.minSize);
const isCollapsed = (p: PanelLimits, size: number) => p.collapsible && size <= p.collapsedSize + EPS;

/** A size the panel may have: within min and max, or collapsed (snapping there when dragged past half-way below min) */
function constrain(p: PanelLimits, v: number): number {
  if (p.collapsible && v < p.minSize) return v < (p.collapsedSize + p.minSize) / 2 ? p.collapsedSize : p.minSize;
  return clamp(v, p.minSize, p.maxSize);
}

/** Panel i set to `target` (as near as its and its neighbour's limits allow), panel i+1 taking the rest of their pair */
function pairSizes(panels: PanelLimits[], sizes: number[], i: number, target: number): number[] {
  const total = sizes[i] + sizes[i + 1];
  let a = constrain(panels[i], target);
  const b = constrain(panels[i + 1], total - a);
  a = total - b;
  if (Math.abs(constrain(panels[i], a) - a) > EPS) return sizes;
  const next = [...sizes];
  next[i] = round(a);
  next[i + 1] = round(total - next[i]);
  return next;
}

/** Sizes from the panels' defaults: panels without one share what is left equally. Always sums to 100. */
function initialSizes(panels: PanelLimits[]): number[] {
  const given = panels.reduce((s, p) => s + (p.defaultSize ?? 0), 0);
  const without = panels.filter((p) => p.defaultSize == null).length;
  const share = without ? Math.max(0, 100 - given) / without : 0;
  const raw = panels.map((p) => p.defaultSize ?? share);
  const sum = raw.reduce((s, v) => s + v, 0) || 1;
  return raw.map((v) => round((v / sum) * 100));
}

const storageKey = (id: string) => `plainspoken-resizable:${id}`;

function loadSizes(id: string | undefined, count: number): number[] | null {
  if (!id) return null;
  try {
    const v = JSON.parse(localStorage.getItem(storageKey(id)) ?? "null");
    if (Array.isArray(v) && v.length === count && v.every((n) => typeof n === "number")) return v;
  } catch {
    // Unavailable storage or bad JSON: start from the defaults.
  }
  return null;
}

/** Reads the panels and handles that are direct children of the group, in order */
function readLayout(el: HTMLElement): Omit<Layout, "sizes"> {
  const panels: PanelLimits[] = [];
  const handles: Record<string, number> = {};
  for (const child of el.children) {
    const d = (child as HTMLElement).dataset;
    if (d.slot === "resizable-panel")
      panels.push({
        id: d.panelId!,
        defaultSize: d.defaultSize ? Number(d.defaultSize) : undefined,
        minSize: Number(d.minSize),
        maxSize: Number(d.maxSize),
        collapsible: d.collapsible === "true",
        collapsedSize: Number(d.collapsedSize),
      });
    else if (d.slot === "resizable-handle") handles[d.handleId!] = panels.length - 1;
  }
  return { panels, handles };
}

export interface ResizablePanelGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** horizontal: panels side by side (the default); vertical: stacked */
  direction?: ResizableDirection;
  /** Remember the sizes in localStorage under this name, so the layout survives a reload */
  autoSaveId?: string;
  /** Called with the sizes (percent, one per panel) after each change: the end of a drag, a key, a collapse */
  onLayout?: (sizes: number[]) => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Panels split by handles that can be dragged, or moved with the keyboard, to resize them: a
 * mail client's folders, list and message, an editor over a terminal. Groups nest (a panel can
 * hold another group in the other direction). Panels and handles must be direct children, in
 * order: panel, handle, panel…
 *
 * Sizes are percentages of the room the panels share. The group fills its container, which must
 * have a height (and a width): `h-[32rem]`, or `flex-1` in a full-height layout. Give every panel
 * a defaultSize so the first render, on the server too, is already right; sizes saved with
 * autoSaveId are only known in the browser, so they take over just after hydration.
 */
export function ResizablePanelGroup({ direction = "horizontal", autoSaveId, onLayout, className, children, ref, ...rest }: ResizablePanelGroupProps) {
  const root = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const latest = useRef({ layout, autoSaveId, onLayout });
  useLayoutEffect(() => {
    latest.current = { layout, autoSaveId, onLayout };
  });
  /** Each collapsed panel's size before it collapsed, to restore it */
  const restore = useRef(new Map<string, number>());

  // After every render, check the children against the layout: the first time (sizes from storage
  // or the defaults), and whenever panels come, go, or change their limits. No dependency list on
  // purpose: the children can change without any of the group's own props changing; the
  // comparison stops it from setting state twice.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = readLayout(el);
    if (layout && JSON.stringify(read.panels) === JSON.stringify(layout.panels) && JSON.stringify(read.handles) === JSON.stringify(layout.handles)) return;
    const sameIds = layout && layout.panels.map((p) => p.id).join() === read.panels.map((p) => p.id).join();
    const sizes = sameIds ? layout.sizes : (loadSizes(autoSaveId, read.panels.length) ?? initialSizes(read.panels));
    setLayout({ ...read, sizes });
  });

  const update = (sizes: number[]) => setLayout((l) => (l ? { ...l, sizes } : l));
  const ctx: GroupContext = {
    direction,
    layout,
    resizePair: (i, target, from) => {
      const l = latest.current.layout;
      if (!l || i < 0 || i + 1 >= l.panels.length) return;
      update(pairSizes(l.panels, from ?? l.sizes, i, target));
    },
    toggle: (i) => {
      const l = latest.current.layout;
      if (!l || i < 0 || i + 1 >= l.panels.length) return;
      const j = l.panels[i].collapsible ? i : l.panels[i + 1].collapsible ? i + 1 : -1;
      if (j >= 0) ctx.collapsePanel(j, !isCollapsed(l.panels[j], l.sizes[j]));
    },
    resizePanel: (j, size) => {
      const l = latest.current.layout;
      if (!l || l.panels.length < 2) return;
      // Take the room from the next panel, or the previous one for the last panel.
      if (j + 1 < l.panels.length) update(pairSizes(l.panels, l.sizes, j, size));
      else update(pairSizes(l.panels, l.sizes, j - 1, l.sizes[j - 1] + l.sizes[j] - size));
    },
    collapsePanel: (j, collapse) => {
      const l = latest.current.layout;
      if (!l || !l.panels[j]?.collapsible) return;
      const p = l.panels[j];
      if (collapse === isCollapsed(p, l.sizes[j])) return;
      const k = j + 1 < l.panels.length ? j + 1 : j - 1;
      if (collapse) {
        restore.current.set(p.id, l.sizes[j]);
        ctx.resizePanel(j, p.collapsedSize);
      } else {
        const room = l.sizes[j] + l.sizes[k] - lowest(l.panels[k]);
        const want = restore.current.get(p.id) ?? p.defaultSize ?? p.minSize;
        ctx.resizePanel(j, clamp(want, p.minSize, Math.min(p.maxSize, room)));
      }
      ctx.commit();
    },
    commit: () => {
      // After the state update has landed
      requestAnimationFrame(() => {
        const { layout: l, autoSaveId: key, onLayout: cb } = latest.current;
        if (!l) return;
        if (key)
          try {
            localStorage.setItem(storageKey(key), JSON.stringify(l.sizes));
          } catch {
            // Not remembered; the layout still works.
          }
        cb?.(l.sizes);
      });
    },
    room: () => {
      const el = root.current;
      if (!el) return 1;
      const r = el.getBoundingClientRect();
      let size = direction === "horizontal" ? r.width : r.height;
      for (const child of el.children)
        if ((child as HTMLElement).dataset.slot === "resizable-handle") {
          const c = child.getBoundingClientRect();
          size -= direction === "horizontal" ? c.width : c.height;
        }
      return Math.max(size, 1);
    },
  };

  return (
    <Ctx value={ctx}>
      <div
        ref={(node) => {
          root.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="resizable-panel-group"
        data-direction={direction}
        className={cn("flex size-full overflow-hidden", direction === "vertical" && "flex-col", className)}
        {...rest}
      >
        {children}
      </div>
    </Ctx>
  );
}

/** What a panel can be told to do from outside, through `panelRef` */
export interface ResizablePanelHandle {
  collapse: () => void;
  expand: () => void;
  isCollapsed: () => boolean;
  /** Set the size in percent, within the panel's limits */
  resize: (size: number) => void;
  getSize: () => number;
}

export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Starting size, percent of the group. Give every panel one, adding up to 100. */
  defaultSize?: number;
  /** Smallest size in percent. Default 10, so a panel never disappears unless it is collapsible. */
  minSize?: number;
  /** Largest size in percent. Default 100. */
  maxSize?: number;
  /** Can be collapsed: dragged past half its minimum, Enter or a double-click on its handle, or `panelRef` */
  collapsible?: boolean;
  /** Size when collapsed, percent. Default 0 (gone, and inert); more leaves a strip such as an icon rail. */
  collapsedSize?: number;
  /** Called when the panel collapses or comes back */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Control it from outside: collapse(), expand(), resize(size) */
  panelRef?: Ref<ResizablePanelHandle>;
  /** Also the DOM id; one is made when left out */
  id?: string;
}

/**
 * One panel of a ResizablePanelGroup. It scrolls its own content. When collapsed to nothing it is
 * inert, so nothing in it can be tabbed to; `data-collapsed` is set either way, for styling an
 * icon rail.
 */
export function ResizablePanel({
  defaultSize,
  minSize = 10,
  maxSize = 100,
  collapsible = false,
  collapsedSize = 0,
  onCollapsedChange,
  panelRef,
  id: ownId,
  className,
  style,
  children,
  ...rest
}: ResizablePanelProps) {
  const g = useGroup("ResizablePanel");
  const autoId = useId();
  const id = ownId ?? autoId;
  const index = g.layout ? g.layout.panels.findIndex((p) => p.id === id) : -1;
  const size = index >= 0 ? g.layout!.sizes[index] : defaultSize;
  const collapsed = collapsible && size != null && size <= collapsedSize + EPS;

  const onChange = useRef(onCollapsedChange);
  useLayoutEffect(() => {
    onChange.current = onCollapsedChange;
  });
  const was = useRef(collapsed);
  useEffect(() => {
    if (was.current !== collapsed) onChange.current?.(collapsed);
    was.current = collapsed;
  }, [collapsed]);

  useImperativeHandle(
    panelRef,
    () => ({
      collapse: () => g.collapsePanel(index, true),
      expand: () => g.collapsePanel(index, false),
      isCollapsed: () => collapsed,
      resize: (s: number) => {
        g.resizePanel(index, s);
        g.commit();
      },
      getSize: () => size ?? 0,
    }),
    [g, index, collapsed, size],
  );

  return (
    <div
      id={id}
      data-slot="resizable-panel"
      data-panel-id={id}
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      data-collapsible={collapsible}
      data-collapsed-size={collapsedSize}
      data-collapsed={collapsed || undefined}
      inert={collapsed && collapsedSize === 0}
      className={cn("min-h-0 min-w-0 overflow-auto", className)}
      style={{ flex: `${size ?? 1} 1 0px`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ResizableHandleProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Draw a small grip in the middle of the line, so it looks draggable */
  withHandle?: boolean;
  /** Percent per arrow key press. Default 5. */
  keyboardStep?: number;
  /** What it resizes, for screen readers: "Resize folder list". Default "Resize". */
  "aria-label"?: string;
}

/**
 * The line between two panels (role="separator", focusable). Drag it; or focus it and use the
 * arrow keys (← → in a horizontal group, ↑ ↓ in a vertical one) to move it by 5%, Home and End to
 * give the panel before it its smallest and largest size, and Enter (or a double-click) to
 * collapse or restore a collapsible neighbour. Its value is the size of the panel before it.
 */
export function ResizableHandle({ withHandle = false, keyboardStep = 5, className, "aria-label": label = "Resize", ...rest }: ResizableHandleProps) {
  const g = useGroup("ResizableHandle");
  const id = useId();
  const i = g.layout?.handles[id] ?? -1;
  const panels = g.layout?.panels;
  const sizes = g.layout?.sizes;
  const ok = !!panels && !!sizes && i >= 0 && i + 1 < panels.length;
  const prev = ok ? panels[i] : undefined;
  const horizontal = g.direction === "horizontal";
  const drag = useRef<{ start: number; sizes: number[]; room: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    document.documentElement.style.removeProperty("cursor");
    document.documentElement.style.removeProperty("user-select");
    g.commit();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!ok || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { start: horizontal ? e.clientX : e.clientY, sizes: [...sizes!], room: g.room() };
    setDragging(true);
    // Keep the resize cursor and stop text selection while the pointer is off the handle.
    document.documentElement.style.cursor = horizontal ? "col-resize" : "row-resize";
    document.documentElement.style.userSelect = "none";
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = (((horizontal ? e.clientX : e.clientY) - d.start) / d.room) * 100;
    g.resizePair(i, d.sizes[i] + delta, d.sizes);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ok) return;
    const less = horizontal ? "ArrowLeft" : "ArrowUp";
    const more = horizontal ? "ArrowRight" : "ArrowDown";
    let target: number | null = null;
    if (e.key === less) target = sizes![i] - keyboardStep;
    else if (e.key === more) target = sizes![i] + keyboardStep;
    else if (e.key === "Home") target = prev!.minSize;
    else if (e.key === "End") target = prev!.maxSize;
    else if (e.key === "Enter") {
      e.preventDefault();
      g.toggle(i);
      return;
    } else return;
    e.preventDefault();
    // A collapsed panel opens to its minimum on the first step out, rather than snapping shut again.
    if (isCollapsed(prev!, sizes![i]) && e.key === more) target = Math.max(target, prev!.minSize);
    g.resizePair(i, target);
    g.commit();
  };

  const valueNow = ok ? Math.round(sizes[i]) : undefined;
  const valueMin = ok ? Math.round(lowest(panels[i])) : undefined;
  const valueMax = ok ? Math.round(Math.min(panels[i].maxSize, sizes[i] + sizes[i + 1] - lowest(panels[i + 1]))) : undefined;
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-controls={prev?.id}
      aria-valuenow={valueNow}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      data-slot="resizable-handle"
      data-handle-id={id}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={() => ok && g.toggle(i)}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex shrink-0 touch-none items-center justify-center bg-border select-none",
        "hover:bg-input data-dragging:bg-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        // A hit area wider than the 1px line
        "after:absolute",
        horizontal ? "w-px cursor-col-resize after:inset-y-0 after:-inset-x-1" : "h-px cursor-row-resize after:inset-x-0 after:-inset-y-1",
        className,
      )}
      {...rest}
    >
      {withHandle && (
        <span
          aria-hidden
          className={cn(
            "z-10 flex items-center justify-center border border-border bg-background text-muted-foreground [&_svg]:size-2.5",
            horizontal ? "h-5 w-3" : "h-3 w-5",
          )}
        >
          <Icon icon={horizontal ? GripVertical : GripHorizontal} />
        </span>
      )}
    </div>
  );
}
