"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from "react";
import { Plus, Table } from "@/registry/plainspoken/lib/icons";
import { pointAnchor, type Anchor } from "@/registry/plainspoken/lib/position";
import { estimateSize, routeAll, rowCentre, schemaFrames, type Box, type Side } from "@/registry/plainspoken/blocks/erd/geometry";
import { autoLayout } from "@/registry/plainspoken/blocks/erd/layout";
import { DEFAULT_DISPLAY, tableById, tableLabel, type ErdDisplay, type ErdModel, type ErdPoint, type ErdRelation } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationLines } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { ErdRelationPopover } from "@/registry/plainspoken/blocks/erd/relation-popover";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";
import { Button } from "@/registry/plainspoken/ui/button";
import { Canvas, CanvasControls, useCanvas, useCanvasNodeRects, type CanvasHandle } from "@/registry/plainspoken/ui/canvas";
import { CanvasMinimap } from "@/registry/plainspoken/ui/canvas-minimap";
import { CanvasNode, CanvasNodes, type CanvasNodeMove } from "@/registry/plainspoken/ui/canvas-node";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { cn } from "@/lib/utils";

/** A column of a table, as the ends of a connection drag */
export interface ErdColumnRef {
  table: string;
  column: string;
}

/** The open relation popover: which relation, pointing where */
export interface ErdOpenRelation {
  id: string;
  anchor: Anchor;
}

/** Where each table goes when nothing says otherwise: the auto-layout, with sizes estimated */
export function defaultPositions(model: ErdModel, collapsed: readonly string[] = []): Record<string, ErdPoint> {
  return autoLayout(model, (id) => {
    const t = tableById(model, id)!;
    return estimateSize(model, t, { collapsed: collapsed.includes(id) });
  });
}

export interface ErdDiagramProps {
  model: ErdModel;
  /** Where each table is, by id. Leave out to start from the auto-layout and keep moves here. */
  positions?: Record<string, ErdPoint>;
  /** While dragging (`move.done` false) and when dropped, and after arrow-key moves */
  onPositionsChange?: (positions: Record<string, ErdPoint>, move: CanvasNodeMove) => void;
  /** Selected table ids, controlled */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Tables folded to their keys, controlled; leave out to keep it here */
  collapsed?: readonly string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  /** Notation, line style, what shows. Missing keys take DEFAULT_DISPLAY's. */
  display?: Partial<ErdDisplay>;
  /** The relation popover, controlled; leave out to keep it here */
  openRelation?: ErdOpenRelation | null;
  onOpenRelationChange?: (open: ErdOpenRelation | null) => void;
  /** ON DELETE or ON UPDATE changed in the popover; leave out for a read-only popover */
  onRelationEdit?: (id: string, patch: Partial<ErdRelation>) => void;
  onRelationDelete?: (id: string) => void;
  /** Enter or a double-click on a table */
  onOpenTable?: (id: string) => void;
  /** Delete on a selected table */
  onDeleteTables?: (ids: string[]) => void;
  /** A column dragged onto another table's column. Without it, rows have no connection handles. */
  onConnect?: (from: ErdColumnRef, to: ErdColumnRef) => void;
  /** Shown on an empty diagram, under the words: an Add table button */
  emptyAction?: ReactNode;
  /** More things on top of the canvas: a legend */
  overlay?: ReactNode;
  canvasRef?: Ref<CanvasHandle>;
  /** Accessible name of the canvas. Default "Diagram of" the model's name. */
  label?: string;
  className?: string;
}

interface Connection {
  from: ErdColumnRef;
  start: ErdPoint & { side: Side };
  to: ErdPoint;
  over: ErdColumnRef | null;
}

/** The column under a pointer, from the DOM: rows carry data-erd-column, tables data-erd-table */
function columnAt(x: number, y: number): ErdColumnRef | null {
  const row = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-erd-column]");
  const table = row?.closest<HTMLElement>("[data-erd-table]")?.dataset.erdTable;
  return row && table ? { table, column: row.dataset.erdColumn! } : null;
}

function DiagramContent({
  model,
  positions,
  onPositions,
  selected,
  onSelected,
  collapsed,
  onCollapsed,
  display,
  active,
  onRelationClick,
  onOpenTable,
  onDeleteTables,
  onConnect,
}: {
  model: ErdModel;
  positions: Record<string, ErdPoint>;
  onPositions: (p: Record<string, ErdPoint>, m: CanvasNodeMove) => void;
  selected: string[];
  onSelected: (ids: string[]) => void;
  collapsed: readonly string[];
  onCollapsed: (id: string, on: boolean) => void;
  display: ErdDisplay;
  active: string | null;
  onRelationClick: (id: string, at: ErdPoint) => void;
  onOpenTable?: (id: string) => void;
  onDeleteTables?: (ids: string[]) => void;
  onConnect?: (from: ErdColumnRef, to: ErdColumnRef) => void;
}) {
  const canvas = useCanvas();
  const rects = useCanvasNodeRects();
  const [hovered, setHovered] = useState<string | null>(null);
  const [conn, setConn] = useState<Connection | null>(null);
  const collapsedSet = useMemo(() => new Set(collapsed), [collapsed]);

  // Positions from the props (fresh while dragging), sizes as measured (or estimated until then)
  const boxes = useMemo(() => {
    const out: Record<string, Box> = {};
    for (const t of model.tables) {
      const p = positions[t.id];
      if (!p) continue;
      const r = rects.get(t.id);
      const size = r ?? estimateSize(model, t, { collapsed: collapsedSet.has(t.id), types: display.types });
      out[t.id] = { x: p.x, y: p.y, width: size.width, height: size.height };
    }
    return out;
  }, [model, positions, rects, collapsedSet, display.types]);
  const routes = useMemo(() => routeAll(model, boxes, collapsedSet, display.lines), [model, boxes, collapsedSet, display.lines]);
  const frames = useMemo(() => (display.frames ? schemaFrames(model, boxes) : []), [display.frames, model, boxes]);

  // What stands out: the hovered (or keyboard-focused) table, else the selection, else the open relation
  const focus = useMemo(() => (hovered ? [hovered] : selected), [hovered, selected]);
  const { lit, related, rowsByTable } = useMemo(() => {
    const lit = new Set<string>();
    for (const r of model.relations) if (focus.includes(r.from.table) || focus.includes(r.to.table) || r.id === active) lit.add(r.id);
    const related = new Set<string>(focus);
    const rows = new Map<string, string[]>();
    const add = (t: string, cols: string[]) => rows.set(t, [...(rows.get(t) ?? []), ...cols]);
    for (const r of model.relations) {
      if (!lit.has(r.id)) continue;
      related.add(r.from.table);
      related.add(r.to.table);
      add(r.from.table, r.from.columns);
      add(r.to.table, r.to.columns);
    }
    return { lit, related, rowsByTable: rows };
  }, [model.relations, focus, active]);
  const dimming = focus.length > 0 || !!active;

  // Connection drag: follow the pointer over the whole window until it's let go
  const latest = useRef({ boxes, model, collapsedSet, onConnect });
  useEffect(() => {
    latest.current = { boxes, model, collapsedSet, onConnect };
  });
  const connectFrom = useCallback(
    (column: string, e: ReactPointerEvent<HTMLElement>) => {
      const table = e.currentTarget.closest<HTMLElement>("[data-erd-table]")?.dataset.erdTable;
      const l = latest.current;
      const t = table ? tableById(l.model, table) : undefined;
      const box = table ? l.boxes[table] : undefined;
      if (!t || !box) return;
      const start = { x: box.x + box.width, y: box.y + rowCentre(l.model, t, [column], l.collapsedSet.has(t.id)), side: "right" as const };
      const from = { table: t.id, column };
      setConn({ from, start, to: canvas.toCanvas(e.clientX, e.clientY), over: null });
      const id = e.pointerId;
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        const over = columnAt(ev.clientX, ev.clientY);
        setConn((c) => c && { ...c, to: canvas.toCanvas(ev.clientX, ev.clientY), over: over && !(over.table === from.table && over.column === from.column) ? over : null });
      };
      const stop = (ev: Event) => {
        if (ev instanceof PointerEvent && ev.pointerId !== id) return;
        if (ev instanceof KeyboardEvent && ev.key !== "Escape") return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        window.removeEventListener("keydown", stop);
        setConn(null);
        if (ev.type !== "pointerup") return;
        const pe = ev as PointerEvent;
        const over = columnAt(pe.clientX, pe.clientY);
        if (over && !(over.table === from.table && over.column === from.column)) latest.current.onConnect?.(from, over);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
      window.addEventListener("keydown", stop);
    },
    [canvas],
  );

  return (
    <>
      {frames.map((f) => (
        <div
          key={f.schema}
          aria-hidden
          data-slot="erd-schema-frame"
          className="pointer-events-none absolute border"
          style={{
            left: f.box.x,
            top: f.box.y,
            width: f.box.width,
            height: f.box.height,
            borderColor: `color-mix(in oklch, ${f.color} 45%, transparent)`,
            background: `color-mix(in oklch, ${f.color} 5%, transparent)`,
          }}
        >
          <div className="flex h-[26px] items-center gap-2 px-2 whitespace-nowrap">
            <span className="size-2.5 shrink-0" style={{ background: f.color }} />
            <b className="text-[14px]">{f.schema}</b>
            <span className="text-[12px] text-muted-foreground">{model.schemas.find((s) => s.name === f.schema)?.comment}</span>
          </div>
        </div>
      ))}
      <ErdRelationLines
        routes={routes}
        notation={display.notation}
        highlighted={dimming ? lit : null}
        active={active}
        onRelationClick={onRelationClick}
        draft={conn && { from: conn.start, to: conn.to }}
      />
      <CanvasNodes
        positions={positions}
        onPositionsChange={onPositions}
        selected={selected}
        onSelectedChange={onSelected}
        snap={display.snap ? 20 : 0}
        keyboardStep={display.snap ? 20 : 10}
        onOpen={onOpenTable}
        onDelete={onDeleteTables}
        roleDescription="table"
        keyHelp="F folds it to its keys and back."
      >
        {model.tables.map((t) =>
          positions[t.id] ? (
            <CanvasNode
              key={t.id}
              id={t.id}
              label={tableLabel(model, t)}
              name={t.name}
              onPointerEnter={(e) => e.buttons === 0 && setHovered(t.id)}
              onPointerLeave={() => setHovered((h) => (h === t.id ? null : h))}
              onFocus={(e) => e.target === e.currentTarget && e.currentTarget.matches(":focus-visible") && setHovered(t.id)}
              onBlur={() => setHovered((h) => (h === t.id ? null : h))}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget || e.key.toLowerCase() !== "f" || e.ctrlKey || e.metaKey || e.altKey) return;
                e.preventDefault();
                onCollapsed(t.id, !collapsedSet.has(t.id));
              }}
            >
              <ErdTableCard
                model={model}
                table={t}
                collapsed={collapsedSet.has(t.id)}
                onCollapsedChange={(on) => onCollapsed(t.id, on)}
                foldUntabbable
                showTypes={display.types}
                showNullability={display.nullability}
                highlightColumns={rowsByTable.get(t.id)}
                dimmed={dimming && !related.has(t.id)}
                selected={selected.includes(t.id)}
                onConnectStart={onConnect ? connectFrom : undefined}
                dropColumn={conn?.over?.table === t.id ? conn.over.column : null}
              />
            </CanvasNode>
          ) : null,
        )}
      </CanvasNodes>
    </>
  );
}

/**
 * An entity-relationship diagram on a Canvas: each table a draggable node (ErdTableCard), each
 * foreign key a routed line with crow's foot marks (ErdRelationLines), optional frames round each
 * schema, a minimap and zoom controls. Hovering, focusing or selecting a table brings out its
 * relations and fades the rest; clicking a line opens its details (ErdRelationPopover). With
 * `onConnect`, dragging the square at the end of a column's row onto another table's column links
 * them. Everything is controlled or not: give `positions`, `selected`, `collapsed` and
 * `openRelation` with their callbacks to keep them yourself (to save them, or undo), or leave them
 * out for a diagram that just works.
 */
export function ErdDiagram({
  model,
  positions: positionsProp,
  onPositionsChange,
  selected: selectedProp,
  onSelectedChange,
  collapsed: collapsedProp,
  onCollapsedChange,
  display: displayProp,
  openRelation: openProp,
  onOpenRelationChange,
  onRelationEdit,
  onRelationDelete,
  onOpenTable,
  onDeleteTables,
  onConnect,
  emptyAction,
  overlay,
  canvasRef,
  label,
  className,
}: ErdDiagramProps) {
  const display = { ...DEFAULT_DISPLAY, ...displayProp };
  const [ownPositions, setOwnPositions] = useState(() => positionsProp ?? defaultPositions(model, collapsedProp));
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const [ownCollapsed, setOwnCollapsed] = useState<readonly string[]>([]);
  const [ownOpen, setOwnOpen] = useState<ErdOpenRelation | null>(null);
  const positions = positionsProp ?? ownPositions;
  const selected = selectedProp ?? ownSelected;
  const collapsed = collapsedProp ?? ownCollapsed;
  const open = openProp !== undefined ? openProp : ownOpen;
  const canvas = useRef<CanvasHandle | null>(null);
  // The canvas's handle, passed on (the Canvas sets it before this runs)
  useImperativeHandle(canvasRef, () => canvas.current!, []);

  const setOpen = (o: ErdOpenRelation | null) => {
    setOwnOpen(o);
    onOpenRelationChange?.(o);
  };
  const select = (ids: string[]) => {
    setOwnSelected(ids);
    onSelectedChange?.(ids);
  };

  return (
    <>
      <Canvas
        label={label ?? `Diagram of ${model.name}`}
        className={cn("min-h-0", className)}
        defaultTransform="fit"
        gridSize={20}
        tool={display.tool}
        canvasRef={canvas}
        overlay={
          <>
            <CanvasControls className="absolute bottom-2 left-2" />
            {display.minimap && model.tables.length > 0 && (
              <CanvasMinimap
                className="absolute right-2 bottom-2 max-sm:hidden"
                width={176}
                height={112}
                label="Minimap of the diagram"
                nodeColor={(id) => model.schemas.find((s) => s.name === tableById(model, id)?.schema)?.color}
              />
            )}
            {model.tables.length === 0 && (
              <EmptyState
                icon={Table}
                title="No tables yet"
                description="Add a table, or import CREATE TABLE statements."
                actions={emptyAction}
                className="absolute inset-x-0 top-1/3 mx-auto w-max max-w-full bg-background"
              />
            )}
            {overlay}
          </>
        }
      >
        <DiagramContent
          model={model}
          positions={positions}
          onPositions={(p, m) => {
            if (!positionsProp) setOwnPositions(p);
            onPositionsChange?.(p, m);
          }}
          selected={selected}
          onSelected={select}
          collapsed={collapsed}
          onCollapsed={(id, on) => {
            const next = on ? [...collapsed, id] : collapsed.filter((x) => x !== id);
            setOwnCollapsed(next);
            onCollapsedChange?.(next);
          }}
          display={display}
          active={open?.id ?? null}
          onRelationClick={(id, at) => setOpen({ id, anchor: pointAnchor(at.x, at.y) })}
          onOpenTable={onOpenTable}
          onDeleteTables={onDeleteTables}
          onConnect={onConnect}
        />
      </Canvas>
      <ErdRelationPopover
        model={model}
        relationId={open?.id ?? null}
        anchor={open?.anchor ?? null}
        notation={display.notation}
        onClose={() => setOpen(null)}
        onChange={onRelationEdit}
        onDelete={
          onRelationDelete &&
          ((id) => {
            setOpen(null);
            onRelationDelete(id);
          })
        }
        onShowTable={(id) => {
          setOpen(null);
          select([id]);
          const b = canvas.current?.getNodes().get(id);
          if (b) canvas.current?.centerOn(b, { animate: true });
        }}
      />
    </>
  );
}

/** A plain "Add table" button for the empty diagram */
export function ErdAddTableButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="primary" icon={Plus} onClick={onClick}>
      Add table
    </Button>
  );
}
