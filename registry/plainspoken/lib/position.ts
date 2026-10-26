/**
 * Anchored positioning for floating layers (tooltips, popovers, menus, hover cards).
 *
 * The floating element is a native popover, so it is already in the top layer with
 * `position: fixed`; this only works out `left` and `top`. It puts the layer on the preferred side
 * of the anchor, flips to the opposite side when that fits and the preferred one does not, then
 * shifts it along both axes to keep it inside the viewport. No dependencies.
 */

export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

/** Anything with a rect: an element, or a point such as where a right-click happened. */
export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect;
}
export type Anchor = Element | VirtualAnchor;

export interface PlaceOptions {
  side?: Side;
  align?: Align;
  /** Gap between anchor and layer, px */
  offset?: number;
  /** Closest the layer may get to the viewport edge, px */
  margin?: number;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** A zero-size anchor at a viewport point, e.g. the pointer position of a contextmenu event. */
export function pointAnchor(x: number, y: number): VirtualAnchor {
  return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
}

/**
 * Position `floating` next to `anchor` once. Returns the side it ended up on, which is also
 * written to `data-side` (for styling an arrow), and sets `--arrow` to where along the layer's
 * edge an arrow should point.
 */
export function place(floating: HTMLElement, anchor: Anchor, opts: PlaceOptions = {}): Side {
  const { side = "bottom", align = "start", offset = 4, margin = 6 } = opts;
  const a = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.visualViewport?.height ?? document.documentElement.clientHeight;
  const w = floating.offsetWidth;
  const h = floating.offsetHeight;

  const room: Record<Side, number> = {
    bottom: vh - margin - (a.bottom + offset),
    top: a.top - offset - margin,
    right: vw - margin - (a.right + offset),
    left: a.left - offset - margin,
  };
  const need = (s: Side) => (s === "top" || s === "bottom" ? h : w);
  let s = side;
  if (room[s] < need(s) && room[OPPOSITE[s]] > room[s]) s = OPPOSITE[s];

  let x: number;
  let y: number;
  if (s === "top" || s === "bottom") {
    y = s === "bottom" ? a.bottom + offset : a.top - offset - h;
    x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
  } else {
    x = s === "right" ? a.right + offset : a.left - offset - w;
    y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
  }
  // Shift into view. When the layer is bigger than the viewport, its start edge wins.
  x = Math.max(margin, Math.min(x, vw - margin - w));
  y = Math.max(margin, Math.min(y, vh - margin - h));

  floating.style.left = `${Math.round(x)}px`;
  floating.style.top = `${Math.round(y)}px`;
  floating.dataset.side = s;
  // Where an arrow should point: the anchor's centre, along the layer's edge.
  const along = s === "top" || s === "bottom" ? a.left + a.width / 2 - x : a.top + a.height / 2 - y;
  const len = s === "top" || s === "bottom" ? w : h;
  floating.style.setProperty("--arrow", `${Math.round(clamp(along, 10, len - 10))}px`);
  return s;
}

/**
 * Keep `floating` placed while it is open: on scroll (of any scroll container), resize,
 * pinch-zoom, and when either element changes size. Returns a cleanup function, to call when
 * the layer closes.
 */
export function autoPlace(floating: HTMLElement, getAnchor: () => Anchor | null, opts: PlaceOptions = {}): () => void {
  let frame = 0;
  const now = () => {
    const a = getAnchor();
    if (a) place(floating, a, opts);
  };
  const later = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(now);
  };
  now();
  window.addEventListener("scroll", later, { capture: true, passive: true });
  window.addEventListener("resize", later);
  window.visualViewport?.addEventListener("resize", later);
  const ro = new ResizeObserver(later);
  ro.observe(floating);
  const a = getAnchor();
  if (a instanceof Element) ro.observe(a);
  return () => {
    // Without data-side the layer is invisible, so a reopen never flashes at its old spot.
    delete floating.dataset.side;
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", later, { capture: true });
    window.removeEventListener("resize", later);
    window.visualViewport?.removeEventListener("resize", later);
    ro.disconnect();
  };
}
