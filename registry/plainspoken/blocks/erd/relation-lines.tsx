"use client";

import { useState } from "react";
import { END_LABEL, MARK_R, endMark, type RoutedRelation, type Side } from "@/registry/plainspoken/blocks/erd/geometry";
import type { EndKind, ErdPoint } from "@/registry/plainspoken/blocks/erd/model";
import { cn } from "@/lib/utils";

export interface ErdEndMarkProps {
  kind: EndKind;
  /** Where the line meets the table, and which side of it */
  x: number;
  y: number;
  side: Side;
}

/**
 * One crow's foot end, drawn outwards from a table's edge; stroke it from the parent `<g>`. Run
 * the line straight through it for `endMark(kind).reach` (routeAll does), so it bends only past
 * the mark.
 */
export function ErdEndMark({ kind, x, y, side }: ErdEndMarkProps) {
  const m = endMark(kind);
  return (
    <g transform={`translate(${x},${y}) scale(${side === "left" ? -1 : 1},1)`}>
      <path d={m.lines} fill="none" />
      {m.circle && <circle cx={m.circle.x} cy={m.circle.y} r={MARK_R} fill="var(--color-background)" />}
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
  /** A connection being dragged out of a column: from its row end to the pointer. ErdDiagram draws it in a second ErdRelationLines over the tables. */
  draft?: { from: ErdPoint & { side: Side }; to: ErdPoint } | null;
  className?: string;
}

/** Drawing order: the faded lines at the bottom, then the plain ones, then the highlighted, then the open one */
const tier = (on: boolean, faded: boolean, active: boolean) => (active ? 3 : on ? 2 : faded ? 0 : 1);

function RelationEnds({ route, ends, notation }: Pick<RoutedRelation, "route" | "ends"> & { notation: "crow" | "labels" }) {
  return notation === "crow" ? (
    <>
      <ErdEndMark kind={ends.parent} {...route.parent} />
      <ErdEndMark kind={ends.child} {...route.child} />
    </>
  ) : (
    <g strokeWidth={0}>
      <EndLabel text={END_LABEL[ends.parent]} {...route.parent} />
      <EndLabel text={END_LABEL[ends.child]} {...route.child} />
    </g>
  );
}

/**
 * The foreign keys of an ERD as lines in one SVG, in canvas coordinates, under the tables. Each
 * runs from the referencing column's row to the referenced key's row, with crow's foot marks
 * (bars for one, a circle for optional, the three-toed foot for many) or, simpler, 1 and N labels.
 * Lines touching a highlighted table stand out and the rest fade; the highlighted ones are drawn
 * over the others, and the line under the pointer over all of them, in full, marks included. A
 * wider invisible stroke under each makes it easy to click. The lines are drawn for sighted users
 * only (aria-hidden): the table details list the same relations as text.
 */
export function ErdRelationLines({ routes, notation = "crow", highlighted, active, onRelationClick, draft, className }: ErdRelationLinesProps) {
  const focus = !!highlighted && highlighted.size > 0;
  const [hover, setHover] = useState<string | null>(null);
  const lines = routes.map((x) => {
    const on = x.relation.id === active || (focus && highlighted!.has(x.relation.id));
    return { ...x, on, faded: focus && !on, tier: tier(on, focus && !on, x.relation.id === active) };
  });
  const ordered = [...lines].sort((a, b) => a.tier - b.tier);
  const hovered = hover != null ? lines.find((x) => x.relation.id === hover) : undefined;
  return (
    <svg
      aria-hidden
      data-slot="erd-relation-lines"
      width={1}
      height={1}
      className={cn("pointer-events-none absolute top-0 left-0 overflow-visible", className)}
    >
      {ordered.map(({ relation: r, route, ends, on, faded }) => (
        <g
          key={r.id}
          data-relation={r.id}
          className={cn(
            "transition-opacity duration-150 motion-reduce:transition-none",
            on ? "stroke-foreground" : "stroke-muted-foreground",
            faded && "opacity-20",
          )}
          strokeWidth={r.id === active ? 2.5 : on ? 1.75 : 1.25}
          strokeLinecap="round"
          fill="none"
        >
          <path d={route.d} />
          <RelationEnds route={route} ends={ends} notation={notation} />
          {onRelationClick && (
            <path
              d={route.d}
              stroke="transparent"
              strokeWidth={12}
              pointerEvents="stroke"
              data-canvas-interactive
              className="cursor-pointer"
              onPointerEnter={() => setHover(r.id)}
              onPointerLeave={() => setHover((h) => (h === r.id ? null : h))}
              onClick={(e) => onRelationClick(r.id, { x: e.clientX, y: e.clientY })}
            />
          )}
        </g>
      ))}
      {hovered && (
        // The line under the pointer, again, on top of the others: whole, unfaded, marks and all
        <g data-relation-hover={hovered.relation.id} className="pointer-events-none stroke-foreground" strokeWidth={hovered.relation.id === active ? 2.5 : 1.75} strokeLinecap="round" fill="none">
          <path d={hovered.route.d} />
          <RelationEnds route={hovered.route} ends={hovered.ends} notation={notation} />
        </g>
      )}
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
