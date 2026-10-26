"use client";

import type { ReactNode } from "react";
import { Hand, Magnet, Plus, Redo2, SquareDashedMousePointer, Undo2, Upload } from "@/registry/plainspoken/lib/icons";
import type { ErdDisplay } from "@/registry/plainspoken/blocks/erd/model";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Separator } from "@/registry/plainspoken/ui/separator";
import { Toggle, ToggleGroup } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

export type ErdExportKind = "sql" | "svg" | "png" | "json";

export interface ErdToolbarProps {
  display: ErdDisplay;
  onDisplayChange: (patch: Partial<ErdDisplay>) => void;
  /** What Undo and Redo would do, in words; null when there is nothing to undo or redo */
  undo: string | null;
  redo: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onAddTable: () => void;
  onAutoLayout: () => void;
  onResetLayout: () => void;
  /** Fold every table to its keys (true) or open them all */
  onCollapseAll: (collapsed: boolean) => void;
  onImport: () => void;
  onExport: (kind: ErdExportKind) => void;
  /** Put the demo's own schema back */
  onStartOver?: () => void;
  /** Before the tools, e.g. a Tables button on phones */
  start?: ReactNode;
  /** After them */
  end?: ReactNode;
  className?: string;
}

/** On phones a button shows just its icon; the words stay for screen readers */
const PHONE_SQUARE = "max-md:w-(--ctl-h) max-md:px-0";
const Words = ({ children }: { children: string }) => <span className="max-md:sr-only">{children}</span>;

/**
 * The ERD's tools in one row of small controls: undo and redo (named after what they'd undo), add
 * a table, the drag tool (pan or select), snap to grid, a Layout menu (auto-layout, reset, fold
 * all, frames, line style), a View menu (notation, types, nullability, minimap, legend), Import
 * and Export. On phones the buttons shrink to their icons and the row scrolls sideways.
 */
export function ErdToolbar({
  display,
  onDisplayChange,
  undo,
  redo,
  onUndo,
  onRedo,
  onAddTable,
  onAutoLayout,
  onResetLayout,
  onCollapseAll,
  onImport,
  onExport,
  onStartOver,
  start,
  end,
  className,
}: ErdToolbarProps) {
  const sep = <Separator orientation="vertical" decorative className="mx-0.5 h-5" />;
  return (
    <div
      role="group"
      aria-label="Diagram tools"
      data-slot="erd-toolbar"
      className={cn("flex min-w-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 py-1 ctl-sm", className)}
    >
      {start}
      <IconButton variant="ghost" icon={Undo2} label={undo ? `Undo: ${undo} (Ctrl+Z)` : "Nothing to undo"} disabled={!undo} onClick={onUndo} />
      <IconButton variant="ghost" icon={Redo2} label={redo ? `Redo: ${redo} (Ctrl+Shift+Z)` : "Nothing to redo"} disabled={!redo} onClick={onRedo} />
      {sep}
      <Button icon={Plus} onClick={onAddTable} className={PHONE_SQUARE}>
        <Words>Add table</Words>
      </Button>
      {sep}
      <ToggleGroup
        type="single"
        label="Dragging the background"
        variant="ghost"
        value={display.tool}
        onValueChange={(v) => v && onDisplayChange({ tool: v as ErdDisplay["tool"] })}
      >
        <Toggle value="pan" icon={Hand} label="Pan: drag the background to move around" />
        <Toggle value="select" icon={SquareDashedMousePointer} label="Select: drag a box round tables" />
      </ToggleGroup>
      <Toggle variant="ghost" icon={Magnet} label="Snap to grid" pressed={display.snap} onPressedChange={(snap) => onDisplayChange({ snap })} />
      {sep}
      <DropdownMenu
        trigger="Layout"
        chevron
        triggerVariant="ghost"
        items={[
          { label: "Auto-layout", hint: "Arrange by relations", onSelect: onAutoLayout },
          { label: "Reset layout", hint: "Open every table, arrange, fit", onSelect: onResetLayout },
          { type: "separator" },
          { label: "Fold every table to its keys", onSelect: () => onCollapseAll(true) },
          { label: "Open every table", onSelect: () => onCollapseAll(false) },
          { type: "separator" },
          { type: "checkbox", label: "Frames round schemas", checked: display.frames, onCheckedChange: (frames) => onDisplayChange({ frames }) },
          {
            type: "radio",
            label: "Lines",
            value: display.lines,
            onValueChange: (v) => onDisplayChange({ lines: v as ErdDisplay["lines"] }),
            options: [
              { value: "orthogonal", label: "Square corners" },
              { value: "curved", label: "Curved" },
            ],
          },
          ...(onStartOver ? [{ type: "separator" as const }, { label: "Start over with the demo schema", onSelect: onStartOver }] : []),
        ]}
      />
      <DropdownMenu
        trigger="View"
        chevron
        triggerVariant="ghost"
        items={[
          {
            type: "radio",
            label: "Notation",
            value: display.notation,
            onValueChange: (v) => onDisplayChange({ notation: v as ErdDisplay["notation"] }),
            options: [
              { value: "crow", label: "Crow's foot" },
              { value: "labels", label: "1 and N labels" },
            ],
          },
          { type: "separator" },
          { type: "checkbox", label: "Column types", checked: display.types, onCheckedChange: (types) => onDisplayChange({ types }) },
          { type: "checkbox", label: "Nullability", checked: display.nullability, onCheckedChange: (nullability) => onDisplayChange({ nullability }) },
          { type: "separator" },
          { type: "checkbox", label: "Minimap", checked: display.minimap, onCheckedChange: (minimap) => onDisplayChange({ minimap }) },
          { type: "checkbox", label: "Legend", checked: display.legend, onCheckedChange: (legend) => onDisplayChange({ legend }) },
        ]}
      />
      {sep}
      <Button variant="ghost" icon={Upload} onClick={onImport} className={PHONE_SQUARE}>
        <Words>Import…</Words>
      </Button>
      <DropdownMenu
        trigger="Export"
        chevron
        triggerVariant="ghost"
        align="end"
        items={[
          { label: "SQL (Postgres)…", hint: "CREATE TABLE statements", onSelect: () => onExport("sql") },
          { label: "SVG image", onSelect: () => onExport("svg") },
          { label: "PNG image", onSelect: () => onExport("png") },
          { label: "JSON", hint: "Schema and positions", onSelect: () => onExport("json") },
        ]}
      />
      {end}
    </div>
  );
}
