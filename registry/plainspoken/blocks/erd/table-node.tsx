"use client";

import { memo, type PointerEvent, type ReactNode } from "react";
import { FoldVertical, Key, Link, UnfoldVertical } from "@/registry/plainspoken/lib/icons";
import { HEADER_H, ROW_H, visibleColumns } from "@/registry/plainspoken/blocks/erd/geometry";
import { columnFlags, schemaColor, type ErdColumn, type ErdModel, type ErdTable } from "@/registry/plainspoken/blocks/erd/model";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/** A tiny boxed abbreviation in a column row, spelled out on hover and for screen readers */
function Mark({ children, title, className }: { children: ReactNode; title: string; className?: string }) {
  return (
    <abbr title={title} className={cn("border border-border px-[3px] font-sans text-[10px] leading-[14px] font-medium text-muted-foreground no-underline", className)}>
      {children}
    </abbr>
  );
}

export interface ErdTableCardProps {
  model: ErdModel;
  table: ErdTable;
  /** Only the keys: primary and foreign keys and columns other tables point at */
  collapsed?: boolean;
  /** Shows the fold button in the header */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Leave the fold button out of the Tab order, when the node it sits in folds with a key of its own */
  foldUntabbable?: boolean;
  /** Column types. Default true. */
  showTypes?: boolean;
  /** NULL marks on columns that may be null. Default true. */
  showNullability?: boolean;
  /** Rows to pick out: the columns of a highlighted relation */
  highlightColumns?: readonly string[];
  /** Faded back, while other tables are highlighted */
  dimmed?: boolean;
  /** Selected on the canvas: on touch screens (no hover) its connection handles show */
  selected?: boolean;
  /** A connection drag starts on a column's handle (the square at the row's right end) */
  onConnectStart?: (column: string, e: PointerEvent<HTMLElement>) => void;
  /** The column a connection drag is over */
  dropColumn?: string | null;
  className?: string;
}

function ColumnRow({
  model,
  table,
  column,
  showTypes,
  showNullability,
  highlighted,
  drop,
  onConnectStart,
}: {
  model: ErdModel;
  table: ErdTable;
  column: ErdColumn;
  showTypes: boolean;
  showNullability: boolean;
  highlighted: boolean;
  drop: boolean;
  onConnectStart?: ErdTableCardProps["onConnectStart"];
}) {
  const f = columnFlags(model, table, column);
  const indexes = table.indexes.filter((i) => i.columns.includes(column.name) && !(i.unique && i.columns.length === 1));
  const def = column.identity ? "Generated always as identity" : column.default != null ? `Default: ${column.default}` : null;
  return (
    <div
      data-erd-column={column.name}
      title={column.comment}
      className={cn(
        "group/row relative flex items-center gap-1.5 pr-2 pl-1 whitespace-nowrap",
        highlighted && "bg-accent",
        drop && "bg-accent outline-2 -outline-offset-2 outline-ring",
      )}
      style={{ height: ROW_H }}
    >
      <span className="flex w-[27px] shrink-0 items-center justify-end gap-px [&_svg]:size-3">
        {f.pk && <Icon icon={Key} label="Primary key" className="text-warning" />}
        {f.fk && <Icon icon={Link} label="Foreign key" className="text-muted-foreground" />}
      </span>
      <span className={cn("font-mono text-[12px]", f.pk && "font-bold")}>{column.name}</span>
      {showTypes && <span className="ml-auto pl-3 font-mono text-[12px] text-muted-foreground">{column.type}</span>}
      <span className={cn("flex items-center gap-0.5", !showTypes && "ml-auto pl-3")}>
        {f.unique && !f.pk && <Mark title="Unique">UQ</Mark>}
        {def && <Mark title={def}>{column.identity ? "ID" : "DEF"}</Mark>}
        {indexes.length > 0 && <Mark title={`Indexed: ${indexes.map((i) => i.name).join(", ")}`}>IDX</Mark>}
        {showNullability && !f.notNull && (
          <Mark title="Nullable: may be empty" className="border-dashed">
            NULL
          </Mark>
        )}
      </span>
      {onConnectStart && (
        <span
          data-canvas-nodrag
          data-erd-handle
          aria-hidden
          title={`Drag to another table's key to make ${column.name} reference it`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            onConnectStart(column.name, e);
          }}
          className={cn(
            "absolute top-1/2 -right-[6px] size-[11px] -translate-y-1/2 cursor-crosshair touch-none border border-foreground bg-background",
            "opacity-0 group-hover/card:opacity-60 group-hover/row:opacity-100 hover:bg-foreground pointer-coarse:size-[15px] pointer-coarse:group-data-[selected]/card:opacity-80",
          )}
        />
      )}
    </div>
  );
}

/**
 * One table of an ERD: a header in the schema's colour with the name and a fold button, then a
 * row per column with key icons (a key for the primary key, a link for a foreign key), the type,
 * and small marks for UQ (unique), DEF or ID (a default, or an identity), IDX (indexed) and NULL
 * (nullable), each spelled out on hover. Column and table comments show on hover too. Folded, it
 * shows only the keys. Header and rows have fixed heights (geometry.ts), so the relation lines
 * can find a column's row without measuring it. A square at the right end of each row starts a
 * connection drag when `onConnectStart` is given.
 */
export const ErdTableCard = memo(function ErdTableCard({
  model,
  table,
  collapsed = false,
  onCollapsedChange,
  foldUntabbable = false,
  showTypes = true,
  showNullability = true,
  highlightColumns,
  dimmed = false,
  selected = false,
  onConnectStart,
  dropColumn,
  className,
}: ErdTableCardProps) {
  const cols = visibleColumns(model, table, collapsed);
  const hidden = table.columns.length - cols.length;
  return (
    <div
      data-slot="erd-table"
      data-erd-table={table.id}
      data-selected={selected || undefined}
      className={cn(
        "group/card min-w-[180px] border border-border bg-background text-[12px] transition-opacity duration-150 motion-reduce:transition-none",
        dimmed && "opacity-35",
        className,
      )}
    >
      <div className="box-border flex flex-col border-b border-border bg-muted" style={{ height: HEADER_H }} title={table.comment}>
        <span aria-hidden className="h-[3px] shrink-0" style={{ background: schemaColor(model, table.schema) }} />
        <div className="flex min-h-0 flex-1 items-center gap-1.5 pr-0.5 pl-2">
          <span className="text-[11px] text-muted-foreground">{table.schema}</span>
          <span className="mr-auto text-[13px] font-bold whitespace-nowrap">{table.name}</span>
          {onCollapsedChange && (
            <IconButton
              size="xs"
              variant="ghost"
              icon={collapsed ? UnfoldVertical : FoldVertical}
              label={collapsed ? `Show every column of ${table.name}` : `Show only the keys of ${table.name}`}
              aria-pressed={collapsed}
              tabIndex={foldUntabbable ? -1 : undefined}
              onClick={() => onCollapsedChange(!collapsed)}
              className="hover:bg-accent"
            />
          )}
        </div>
      </div>
      {cols.map((c) => (
        <ColumnRow
          key={c.name}
          model={model}
          table={table}
          column={c}
          showTypes={showTypes}
          showNullability={showNullability}
          highlighted={!!highlightColumns?.includes(c.name)}
          drop={dropColumn === c.name}
          onConnectStart={onConnectStart}
        />
      ))}
      {hidden > 0 && (
        <div className="flex items-center pl-[37px] text-[11px] text-muted-foreground italic" style={{ height: ROW_H }}>
          {hidden} more {hidden === 1 ? "column" : "columns"}
        </div>
      )}
    </div>
  );
});
