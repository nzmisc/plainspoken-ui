"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Database, List, PanelRight } from "@/registry/plainspoken/lib/icons";
import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { defaultPositions, ErdAddTableButton, ErdDiagram, type ErdColumnRef, type ErdOpenRelation } from "@/registry/plainspoken/blocks/erd/diagram";
import { diagramSvg, download, resolvePalette, svgToPng, toJson } from "@/registry/plainspoken/blocks/erd/export";
import { estimateSize, type Box } from "@/registry/plainspoken/blocks/erd/geometry";
import { autoLayout } from "@/registry/plainspoken/blocks/erd/layout";
import { ErdLegend } from "@/registry/plainspoken/blocks/erd/legend";
import {
  addRelation,
  addTable,
  connectColumns,
  DEFAULT_DISPLAY,
  deleteRelation,
  deleteTables,
  endText,
  newId,
  tableById,
  updateColumn,
  updateRelation,
  type ErdDisplay,
  type ErdDocument,
  type ErdModel,
  type ErdPoint,
  type ErdTable,
} from "@/registry/plainspoken/blocks/erd/model";
import { ErdExportDialog, ErdImportDialog, type ErdImport } from "@/registry/plainspoken/blocks/erd/sql-dialogs";
import { ErdTableDetails } from "@/registry/plainspoken/blocks/erd/table-details";
import { ErdTableList } from "@/registry/plainspoken/blocks/erd/table-list";
import { ErdToolbar, type ErdExportKind } from "@/registry/plainspoken/blocks/erd/toolbar";
import { IconButton } from "@/registry/plainspoken/ui/button";
import type { CanvasHandle } from "@/registry/plainspoken/ui/canvas";
import type { CanvasNodeMove } from "@/registry/plainspoken/ui/canvas-node";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Toaster, toast } from "@/registry/plainspoken/ui/toast";
import { cn } from "@/lib/utils";

/** The demo shop, laid out */
export const DEMO_DOCUMENT: ErdDocument = { model: SHOP_MODEL, positions: defaultPositions(SHOP_MODEL) };

/** A saved document that still has the shape this code expects (it may be from an older version) */
const usable = (d: unknown): d is ErdDocument => {
  const x = d as ErdDocument | null;
  return !!x && !!x.model && Array.isArray(x.model.tables) && Array.isArray(x.model.relations) && Array.isArray(x.model.schemas) && typeof x.positions === "object" && x.positions !== null;
};

interface Entry {
  doc: ErdDocument;
  label: string;
}

const WIDE = "(min-width: 64rem)";
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export interface ErdAppProps {
  /** The document to start with, and to start over with. Default: the demo shop, harbour_goods. */
  initial?: ErdDocument;
  /** Remember the diagram, positions and view settings in localStorage under keys starting with this. Leave out to forget on reload. */
  storageKey?: string;
  /** Tables selected at first (one opens its details) */
  defaultSelected?: string[];
  defaultDisplay?: Partial<ErdDisplay>;
  /** Open a dialog on load, for stories */
  defaultDialog?: "import" | "export" | null;
  /** On phones, open a drawer on load, for stories */
  defaultPanel?: "tables" | "details" | null;
  /** More controls at the right of the title bar: a theme switch */
  actions?: ReactNode;
  /** The frame: full window height by default */
  className?: string;
}

/**
 * Joinery, an ERD editor for a Postgres database, as a demo: the table list with search on the
 * left, the diagram in the middle, the selected table's details on the right (both drawers on
 * narrow screens), and a toolbar over the diagram.
 *
 * Everything works in the browser: drag tables (positions are remembered with `storageKey`),
 * auto-layout, fold tables to their keys, connect columns by dragging, add, rename and delete
 * tables and columns, change types, undo and redo (Ctrl+Z, Ctrl+Shift+Z), import CREATE TABLE
 * statements, and export SQL, SVG, PNG or JSON. Nothing is sent anywhere.
 */
export function ErdApp({ initial = DEMO_DOCUMENT, storageKey, defaultSelected = [], defaultDisplay, defaultDialog = null, defaultPanel = null, actions, className }: ErdAppProps) {
  const [stored, setDoc] = useStoredState<ErdDocument>(storageKey && `${storageKey}-doc`, initial);
  const doc = usable(stored) ? stored : initial;
  const [storedDisplay, setDisplay] = useStoredState<ErdDisplay>(storageKey && `${storageKey}-display`, { ...DEFAULT_DISPLAY, ...defaultDisplay });
  const display = { ...DEFAULT_DISPLAY, ...storedDisplay };
  const [collapsed, setCollapsed] = useStoredState<string[]>(storageKey && `${storageKey}-collapsed`, []);
  const [history, setHistory] = useState<{ past: Entry[]; future: Entry[] }>({ past: [], future: [] });
  const [live, setLive] = useState<Record<string, ErdPoint> | null>(null);
  const [selectedRaw, setSelected] = useState<string[]>(defaultSelected);
  const [openRelation, setOpenRelation] = useState<ErdOpenRelation | null>(null);
  const [dialog, setDialog] = useState<"import" | "export" | null>(defaultDialog);
  const [panel, setPanel] = useState<"tables" | "details" | null>(defaultPanel);
  const [message, setMessage] = useState("");
  const canvas = useRef<CanvasHandle>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastMove = useRef<{ ids: string; at: number } | null>(null);

  const { model } = doc;
  const positions = live ?? doc.positions;
  const selected = selectedRaw.filter((id) => tableById(model, id));
  const detailsId = selected.length === 1 ? selected[0] : null;

  const announce = (m: string) => setMessage((old) => (old === m ? `${m} ` : m));
  /** Every change to the document goes through here, so it can be undone */
  const commit = (next: ErdDocument, label: string, o: { quiet?: boolean; coalesce?: boolean } = {}) => {
    if (!o.coalesce) setHistory((h) => ({ past: [...h.past, { doc, label }].slice(-100), future: [] }));
    else setHistory((h) => ({ ...h, future: [] }));
    setDoc(next);
    if (!o.quiet) announce(label);
  };
  const editModel = (m: ErdModel, label: string) => commit({ ...doc, model: m }, label);
  const undoLabel = history.past.at(-1)?.label ?? null;
  const redoLabel = history.future[0]?.label ?? null;
  const undo = () => {
    const e = history.past.at(-1);
    if (!e) return;
    setHistory({ past: history.past.slice(0, -1), future: [{ doc, label: e.label }, ...history.future] });
    setDoc(e.doc);
    lastMove.current = null;
    announce(`Undone: ${e.label}`);
  };
  const redo = () => {
    const e = history.future[0];
    if (!e) return;
    setHistory({ past: [...history.past, { doc, label: e.label }], future: history.future.slice(1) });
    setDoc(e.doc);
    announce(`Redone: ${e.label}`);
  };
  const undoToast = (title: string) => toast({ title, action: { label: "Undo", onClick: () => document.dispatchEvent(new CustomEvent("erd-undo")) } });

  // Ctrl+Z and friends, except where text is being typed (it has its own undo) or a dialog is up
  const keys = useRef({ undo, redo });
  useEffect(() => {
    keys.current = { undo, redo };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target as Element | null;
      if (t?.closest("input, textarea, select, [contenteditable='true'], dialog[open]")) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) keys.current.undo();
      else if ((k === "z" && e.shiftKey) || k === "y") keys.current.redo();
      else return;
      e.preventDefault();
    };
    const onUndo = () => keys.current.undo();
    window.addEventListener("keydown", onKey);
    document.addEventListener("erd-undo", onUndo);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("erd-undo", onUndo);
    };
  }, []);

  const fitSoon = () => requestAnimationFrame(() => requestAnimationFrame(() => canvas.current?.fit({ animate: true })));
  const wide = () => matchMedia(WIDE).matches;
  const sizeOf = (m: ErdModel, folded: readonly string[], measured = true) => {
    const rects = canvas.current?.getNodes();
    return (id: string) => {
      const est = estimateSize(m, tableById(m, id)!, { collapsed: folded.includes(id), types: display.types });
      const r = measured ? rects?.get(id) : undefined;
      return { width: r?.width ?? est.width, height: est.height };
    };
  };

  const onPositionsChange = (next: Record<string, ErdPoint>, move: CanvasNodeMove) => {
    if (!move.done) return setLive(next);
    setLive(null);
    // A run of arrow-key presses on the same tables is one step to undo
    const ids = move.ids.join();
    const now = performance.now();
    const coalesce = move.source === "keyboard" && lastMove.current?.ids === ids && now - lastMove.current.at < 1500;
    lastMove.current = move.source === "keyboard" ? { ids, at: now } : null;
    const names = move.ids.map((id) => tableById(model, id)?.name ?? id);
    commit({ ...doc, positions: next }, names.length === 1 ? `Moved ${names[0]}` : `Moved ${plural(names.length, "table")}`, { quiet: true, coalesce });
  };

  const pick = (id: string) => {
    setSelected([id]);
    setOpenRelation(null);
    setPanel(null);
    const c = canvas.current;
    const r = c?.getNodes().get(id);
    if (c && r) c.centerOn(r, { zoom: Math.max(c.getTransform().zoom, 0.9), animate: true });
  };

  const openTable = (id: string) => {
    setSelected([id]);
    if (wide()) requestAnimationFrame(() => heading.current?.focus());
    else setPanel("details");
  };

  const addNewTable = () => {
    const schema = (detailsId && tableById(model, detailsId)?.schema) || model.schemas[0]?.name || "public";
    let name = "new_table";
    for (let n = 2; model.tables.some((t) => t.schema === schema && t.name === name); n++) name = `new_table_${n}`;
    const id = newId("tbl");
    const table: ErdTable = {
      id,
      schema,
      name,
      columns: [
        { name: "id", type: "bigint", pk: true, notNull: true, identity: true },
        { name: "created_at", type: "timestamptz", notNull: true, default: "now()" },
      ],
      indexes: [],
    };
    const v = canvas.current?.getVisibleRect() ?? { x: 0, y: 0, width: 400, height: 300 };
    const snap = (n: number) => Math.round(n / 20) * 20;
    const at = { x: snap(v.x + v.width / 2 - 100), y: snap(v.y + v.height / 2 - 50) };
    commit({ model: addTable(model, table), positions: { ...doc.positions, [id]: at } }, `Added table ${name} to ${schema}`);
    setSelected([id]);
    if (wide()) requestAnimationFrame(() => document.querySelector<HTMLInputElement>("[data-slot=erd-table-details] input")?.select());
    else setPanel("details");
  };

  const onConnect = (a: ErdColumnRef, b: ErdColumnRef) => {
    const r = connectColumns(model, a, b);
    if ("error" in r) {
      toast({ title: "Couldn't connect them", description: r.error, variant: "destructive" });
      announce(r.error);
      return;
    }
    let next = addRelation(model, r.relation);
    if (r.retype) next = updateColumn(next, r.retype.table, r.retype.column.name, r.retype.column);
    const child = tableById(model, r.relation.from.table)!;
    const label = `${child.name}.${r.relation.from.columns[0]} now references ${endText(model, r.relation.to)}`;
    editModel(next, label);
    undoToast(r.retype ? `${label}; its type is now ${r.retype.column.type}` : label);
  };

  const onDeleteTables = (ids: string[]) => {
    const names = ids.map((id) => tableById(model, id)?.name ?? id);
    const label = names.length === 1 ? `Deleted table ${names[0]}` : `Deleted ${plural(names.length, "table")}`;
    editModel(deleteTables(model, ids), label);
    setSelected([]);
    undoToast(label);
  };

  const layout = (reset: boolean) => {
    const folded = reset ? [] : collapsed;
    if (reset) setCollapsed([]);
    commit({ ...doc, positions: autoLayout(model, sizeOf(model, folded)) }, reset ? "Reset the layout" : "Auto-layout");
    fitSoon();
  };

  const onImport = ({ model: m, positions: p }: ErdImport) => {
    setCollapsed([]);
    setSelected([]);
    setOpenRelation(null);
    commit({ model: m, positions: p ?? autoLayout(m, sizeOf(m, [], false)) }, `Imported ${plural(m.tables.length, "table")}`);
    undoToast(`Imported ${plural(m.tables.length, "table")} and ${plural(m.relations.length, "relation")}`);
    fitSoon();
  };

  const exportAs = async (kind: ErdExportKind) => {
    if (kind === "sql") return setDialog("export");
    if (kind === "json") {
      download(`${model.name}.json`, toJson(doc), "application/json");
      return toast(`Saved ${model.name}.json`);
    }
    const rects = canvas.current?.getNodes();
    const boxes: Record<string, Box> = {};
    for (const t of model.tables) {
      const p = doc.positions[t.id];
      if (!p) continue;
      const est = estimateSize(model, t, { collapsed: collapsed.includes(t.id), types: display.types });
      const r = rects?.get(t.id);
      boxes[t.id] = { x: p.x, y: p.y, width: r?.width ?? est.width, height: r?.height ?? est.height };
    }
    const { svg, width, height } = diagramSvg(model, boxes, { display, collapsed: new Set(collapsed), palette: resolvePalette(model) });
    if (kind === "svg") {
      download(`${model.name}.svg`, svg, "image/svg+xml");
      return toast(`Saved ${model.name}.svg`);
    }
    try {
      download(`${model.name}.png`, await svgToPng(svg, width, height, 2));
      toast(`Saved ${model.name}.png`);
    } catch (e) {
      toast({ title: "Couldn't make the PNG", description: (e as Error).message, variant: "destructive" });
    }
  };

  const showRelation = useCallback((id: string, from: HTMLElement) => setOpenRelation({ id, anchor: from }), []);

  const list = (
    <ErdTableList
      model={model}
      selected={selected}
      onPick={pick}
      className="min-h-0 flex-1"
    />
  );
  // In the side panel it has its own ×; in the phone drawer the drawer's × does that
  const details = (inDrawer: boolean) =>
    detailsId ? (
      <ErdTableDetails
        key={detailsId}
        model={model}
        tableId={detailsId}
        onModelChange={editModel}
        onShowRelation={showRelation}
        onSelectTable={pick}
        onClose={
          inDrawer
            ? undefined
            : () => {
                setSelected([]);
                setPanel(null);
              }
        }
        headingRef={inDrawer ? undefined : heading}
        className="min-h-0 flex-1"
      />
    ) : null;

  return (
    <div data-slot="erd-app" className={cn("flex h-dvh flex-col overflow-hidden bg-background text-foreground", className)}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-muted px-3">
        <span className="flex items-center gap-1.5 font-bold">
          <Icon icon={Database} />
          Joinery
        </span>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <h1 className="min-w-0 truncate font-mono text-[13px]">{model.name}</h1>
        <span className="text-[12px] text-muted-foreground max-sm:hidden">
          {plural(model.tables.length, "table")}, {plural(model.relations.length, "relation")}
        </span>
        <div className="ml-auto flex items-center gap-1 ctl-sm">{actions}</div>
      </header>
      <ErdToolbar
        display={display}
        onDisplayChange={(patch) => setDisplay((d) => ({ ...DEFAULT_DISPLAY, ...d, ...patch }))}
        undo={undoLabel}
        redo={redoLabel}
        onUndo={undo}
        onRedo={redo}
        onAddTable={addNewTable}
        onAutoLayout={() => layout(false)}
        onResetLayout={() => layout(true)}
        onCollapseAll={(on) => setCollapsed(on ? model.tables.map((t) => t.id) : [])}
        onImport={() => setDialog("import")}
        onExport={exportAs}
        onStartOver={() => {
          setCollapsed([]);
          setSelected([]);
          commit(initial, "Started over with the demo schema");
          fitSoon();
        }}
        start={
          <IconButton icon={List} label="Tables" variant="ghost" className="lg:hidden" aria-expanded={panel === "tables"} onClick={() => setPanel("tables")} />
        }
        end={
          <IconButton
            icon={PanelRight}
            label={detailsId ? `Details of ${tableById(model, detailsId)?.name}` : "Details: select a table first"}
            variant="ghost"
            disabled={!detailsId}
            className="ml-auto lg:hidden"
            aria-expanded={panel === "details"}
            onClick={() => setPanel("details")}
          />
        }
      />
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Tables" className="hidden w-60 shrink-0 flex-col border-r border-border lg:flex">
          {list}
        </aside>
        <main className="relative flex min-w-0 flex-1 flex-col">
          <ErdDiagram
            model={model}
            positions={positions}
            onPositionsChange={onPositionsChange}
            selected={selected}
            onSelectedChange={(ids) => {
              setSelected(ids);
              if (ids.length !== 1) setOpenRelation(null);
            }}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            display={display}
            openRelation={openRelation}
            onOpenRelationChange={setOpenRelation}
            onRelationEdit={(id, patch) => {
              const r = model.relations.find((x) => x.id === id);
              const what = Object.entries(patch)
                .map(([k, v]) => `${k === "onDelete" ? "ON DELETE" : "ON UPDATE"} ${v}`)
                .join(", ");
              editModel(updateRelation(model, id, patch), `Set ${what} on ${r?.name ?? "the relation"}`);
            }}
            onRelationDelete={(id) => {
              const r = model.relations.find((x) => x.id === id);
              const label = `Deleted relationship ${r?.name ?? ""}`.trim();
              editModel(deleteRelation(model, id), label);
              undoToast(label);
            }}
            onOpenTable={openTable}
            onDeleteTables={onDeleteTables}
            onConnect={onConnect}
            emptyAction={<ErdAddTableButton onClick={addNewTable} />}
            overlay={
              display.legend && (
                <ErdLegend
                  notation={display.notation}
                  schemas={model.schemas}
                  onClose={() => setDisplay((d) => ({ ...DEFAULT_DISPLAY, ...d, legend: false }))}
                  className="absolute top-2 left-2 max-h-[calc(100%-3.5rem)] overflow-y-auto"
                />
              )
            }
            canvasRef={canvas}
            label={`Diagram of ${model.name}`}
            className="flex-1"
          />
        </main>
        <aside aria-label="Table details" className={cn("hidden w-[25rem] shrink-0 flex-col border-l border-border", detailsId && "lg:flex")}>
          {details(false)}
        </aside>
      </div>

      <Drawer open={panel === "tables"} onClose={() => setPanel(null)} side="left" title="Tables" bodyClassName="flex flex-col p-0" className="w-72">
        {list}
      </Drawer>
      <Drawer open={panel === "details" && !!detailsId} onClose={() => setPanel(null)} title="Table details" bodyClassName="flex flex-col p-0">
        {details(true) ?? <EmptyState title="No table selected" description="Pick a table in the list or on the diagram." />}
      </Drawer>

      <ErdExportDialog open={dialog === "export"} onClose={() => setDialog(null)} model={model} />
      <ErdImportDialog open={dialog === "import"} onClose={() => setDialog(null)} onImport={onImport} />
      <span role="status" className="sr-only">
        {message}
      </span>
      <Toaster />
    </div>
  );
}
