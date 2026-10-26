"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { unionRect, useCanvas, useCanvasNodeRects, useCanvasSize, useCanvasTransform, type CanvasPoint, type CanvasRect } from "@/registry/plainspoken/ui/canvas";
import { cn } from "@/lib/utils";

export interface CanvasMinimapProps {
  /** Size of the map, px. Default 192 × 128. */
  width?: number;
  height?: number;
  /** Fill of a node, by its id: a chart token for its group, say. Default the muted text colour. */
  nodeColor?: (id: string) => string | undefined;
  /** Accessible name. Default "Minimap". */
  label?: string;
  className?: string;
}

/**
 * The whole canvas in small: every node as a block, and a frame for the part in view. Drag the
 * frame to pan, or press anywhere on the map to jump there and drag on. With the map focused,
 * arrow keys pan the canvas. Put it in a Canvas's `overlay`, positioned where you want it
 * (`absolute right-2 bottom-2`). It reads the nodes from the canvas, so it needs CanvasNodes (or
 * anything else that registers nodes) to show anything but the frame.
 */
export function CanvasMinimap({ width = 192, height = 128, nodeColor, label = "Minimap", className }: CanvasMinimapProps) {
  const canvas = useCanvas();
  const t = useCanvasTransform();
  const nodes = useCanvasNodeRects();
  const size = useCanvasSize();
  const descId = useId();
  // While dragging, the map's own scale stays put, or it would shift under the pointer as the frame moves
  const [frozen, setFrozen] = useState<CanvasRect | null>(null);
  const grab = useRef<{ id: number; offset: CanvasPoint; map: { s: number; ox: number; oy: number } } | null>(null);

  const view: CanvasRect = { x: -t.x / t.zoom, y: -t.y / t.zoom, width: size.width / t.zoom, height: size.height / t.zoom };
  const content = unionRect(nodes.values());
  let area = frozen ?? unionRect(content ? [content, view] : [view])!;
  if (!frozen) {
    const pad = Math.max(area.width, area.height) * 0.04;
    area = { x: area.x - pad, y: area.y - pad, width: area.width + pad * 2, height: area.height + pad * 2 };
  }
  const s = Math.min(width / Math.max(area.width, 1), height / Math.max(area.height, 1));
  const ox = (width - area.width * s) / 2 - area.x * s;
  const oy = (height - area.height * s) / 2 - area.y * s;

  const toWorld = (e: PointerEvent<SVGSVGElement>, m = { s, ox, oy }): CanvasPoint => {
    const b = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - b.left - m.ox) / m.s, y: (e.clientY - b.top - m.oy) / m.s };
  };

  return (
    <div
      data-slot="canvas-minimap"
      role="group"
      aria-roledescription="minimap"
      aria-label={label}
      aria-describedby={descId}
      tabIndex={0}
      className={cn("border border-border bg-background", FOCUS_RING, className)}
      style={{ width: width + 2, height: height + 2 }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 200 : 50;
        const pan: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (!pan[e.key]) return;
        e.preventDefault();
        canvas.panBy(...pan[e.key]);
      }}
    >
      <span id={descId} hidden>
        Drag the frame to move the view. Arrow keys pan.
      </span>
      <svg
        aria-hidden
        width={width}
        height={height}
        className="block cursor-pointer touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          const map = { s, ox, oy };
          const p = toWorld(e, map);
          const inside = p.x >= view.x && p.x <= view.x + view.width && p.y >= view.y && p.y <= view.y + view.height;
          const centre = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
          grab.current = { id: e.pointerId, offset: inside ? { x: p.x - centre.x, y: p.y - centre.y } : { x: 0, y: 0 }, map };
          if (!inside) canvas.centerOn(p);
          setFrozen(area);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const g = grab.current;
          if (!g || g.id !== e.pointerId) return;
          const p = toWorld(e, g.map);
          canvas.centerOn({ x: p.x - g.offset.x, y: p.y - g.offset.y });
        }}
        onPointerUp={() => {
          grab.current = null;
          setFrozen(null);
        }}
        onPointerCancel={() => {
          grab.current = null;
          setFrozen(null);
        }}
      >
        {[...nodes].map(([id, r]) => (
          <rect
            key={id}
            x={r.x * s + ox}
            y={r.y * s + oy}
            width={Math.max(1, r.width * s)}
            height={Math.max(1, r.height * s)}
            fill={nodeColor?.(id) ?? "var(--color-muted-foreground)"}
            fillOpacity={0.55}
          />
        ))}
        {size.width > 0 && (
          <rect
            x={view.x * s + ox}
            y={view.y * s + oy}
            width={view.width * s}
            height={view.height * s}
            fill="var(--color-foreground)"
            fillOpacity={0.06}
            stroke="var(--color-foreground)"
            strokeWidth={1.5}
            className="cursor-grab"
          />
        )}
      </svg>
    </div>
  );
}
