"use client";

import { END_LABEL, endMark, type RoutedRelation, type Side } from "@/registry/plainspoken/blocks/erd/geometry";
import type { EndKind, ErdPoint } from "@/registry/plainspoken/blocks/erd/model";
import { cn } from "@/lib/utils";

export interface ErdEndMarkProps {
  kind: EndKind;
  /** Where the line meets the table, and which side of it */
  x: number;
  y: number;
  side: Side;
}

/** One crow's foot end, drawn outwards from a table's edge; stroke it from the parent `<g>`. */
export function ErdEndMark({ kind, x, y, side }: ErdEndMarkProps) {
  const m = endMark(kind);
  return (
    <g transform={`translate(${x},${y}) scale(${side === "left" ? -1 : 1},1)`}>
      <path d={m.lines} fill="none" />
      {m.circle && <circle cx={m.circle.x} cy={m.circle.y} r={3.5} fill="var(--color-background)" />}
    </g>
  );
}

function EndLabel({ text, x, y, side }: { text: string; x: number; y: number; side: Side }) {
  return (
    <text
      x={x + (side === "left" ? -6 : 6)}
      y={y - 5}
      textAnchor={side === "left" ? "end" : "start"}
      className="fill-foreground stroke-background font-sans text-[11px] font-semibold"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

export interface ErdRelationLinesProps {
  /** From routeAll() in geometry.ts */
  routes: RoutedRelation[];
  /** Crow's foot marks, or 1 / N labels */
  notation?: "crow" | "labels";
  /** Relations to draw strongly; when given, the others fade */
  highlighted?: ReadonlySet<string> | null;
  /** The relation whose details are open */
  active?: string | null;
  /** A click on a line, with where it happened (viewport px) */
  onRelationClick?: (id: string, at: ErdPoint) => void;
  /** A connection being dragged out of a column: from its row end to the pointer */
  draft?: { from: ErdPoint & { side: Side }; to: ErdPoint } | null;
  className?: string;
}

/**
 * The foreign keys of an ERD as lines in one SVG, in canvas coordinates, under the tables. Each
 * runs from the referencing column's row to the referenced key's row, with crow's foot marks
 * (bars for one, a circle for optional, the three-toed foot for many) or, simpler, 1 and N labels.
 * Lines touching a highlighted table stand out and the rest fade; a wider invisible stroke under
 * each makes it easy to click. The lines are drawn for sighted users only (aria-hidden): the
 * table details list the same relations as text.
 */
export function ErdRelationLines({ routes, notation = "crow", highlighted, active, onRelationClick, draft, className }: ErdRelationLinesProps) {
  const focus = !!highlighted && highlighted.size > 0;
  return (
    <svg
      aria-hidden
      data-slot="erd-relation-lines"
      width={1}
      height={1}
      className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", className)}
    >
      {routes.map(({ relation: r, route, ends }) => {
        const on = r.id === active || (focus && highlighted!.has(r.id));
        const faded = focus && !on && r.id !== active;
        return (
          <g
            key={r.id}
            data-relation={r.id}
            className={cn(
              "group/line transition-opacity duration-150 motion-reduce:transition-none",
              on ? "stroke-foreground" : "stroke-muted-foreground",
              faded && "opacity-20",
            )}
            strokeWidth={r.id === active ? 2.5 : on ? 1.75 : 1.25}
            strokeLinecap="round"
            fill="none"
          >
            <path d={route.d} className="group-hover/line:stroke-foreground" />
            {notation === "crow" ? (
              <>
                <ErdEndMark kind={ends.parent} {...route.parent} />
                <ErdEndMark kind={ends.child} {...route.child} />
              </>
            ) : (
              <g strokeWidth={0}>
                <EndLabel text={END_LABEL[ends.parent]} {...route.parent} />
                <EndLabel text={END_LABEL[ends.child]} {...route.child} />
              </g>
            )}
            {onRelationClick && (
              <path
                d={route.d}
                stroke="transparent"
                strokeWidth={12}
                pointerEvents="stroke"
                data-canvas-interactive
                className="cursor-pointer"
                onClick={(e) => onRelationClick(r.id, { x: e.clientX, y: e.clientY })}
              />
            )}
          </g>
        );
      })}
      {draft && (
        <path
          d={`M${draft.from.x},${draft.from.y} C${draft.from.x + (draft.from.side === "left" ? -60 : 60)},${draft.from.y} ${draft.to.x},${draft.to.y} ${draft.to.x},${draft.to.y}`}
          fill="none"
          strokeWidth={2}
          strokeDasharray="6 4"
          className="stroke-foreground"
        />
      )}
    </svg>
  );
}
