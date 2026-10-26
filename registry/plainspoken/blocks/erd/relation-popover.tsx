"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowRight, Trash, X } from "@/registry/plainspoken/lib/icons";
import type { Anchor } from "@/registry/plainspoken/lib/position";
import { END_LABEL } from "@/registry/plainspoken/blocks/erd/geometry";
import { ErdEndMark } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { cardinality, describeRelation, qualified, REF_ACTIONS, tableById, type ErdModel, type ErdRelation, type RefAction } from "@/registry/plainspoken/blocks/erd/model";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Select } from "@/registry/plainspoken/ui/select";
import { cn } from "@/lib/utils";

/** The two ends of a relation in small, as the legend draws them: the referenced table on the left */
export function ErdCardinalityPicture({ model, relation, notation = "crow", className }: { model: ErdModel; relation: ErdRelation; notation?: "crow" | "labels"; className?: string }) {
  const ends = cardinality(model, relation);
  return (
    <svg aria-hidden width={96} height={20} viewBox="0 -10 96 20" className={cn("shrink-0 overflow-visible", className)}>
      <g className="stroke-foreground" strokeWidth={1.5} fill="none" strokeLinecap="round">
        <path d="M2,0 H94" />
        {notation === "crow" ? (
          <>
            <ErdEndMark kind={ends.parent} x={2} y={0} side="right" />
            <ErdEndMark kind={ends.child} x={94} y={0} side="left" />
          </>
        ) : (
          <g strokeWidth={0} className="fill-foreground font-sans text-[11px] font-semibold">
            <text x={4} y={-3}>
              {END_LABEL[ends.parent]}
            </text>
            <text x={92} y={-3} textAnchor="end">
              {END_LABEL[ends.child]}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

export interface ErdRelationPopoverProps {
  model: ErdModel;
  /** The relation to show; null closes it */
  relationId: string | null;
  /** Where it points: the clicked spot on the line (a point anchor), or the button that opened it */
  anchor: Anchor | null;
  onClose: () => void;
  notation?: "crow" | "labels";
  /** ON DELETE and ON UPDATE changed */
  onChange?: (id: string, patch: Partial<ErdRelation>) => void;
  onDelete?: (id: string) => void;
  /** Go to one of its tables */
  onShowTable?: (tableId: string) => void;
}

/**
 * A relation's details, next to where it was clicked: which columns reference which, the
 * cardinality in marks and in words, ON DELETE and ON UPDATE (editable), the constraint's name,
 * and a button to delete it. Escape or a click outside closes it.
 */
export function ErdRelationPopover({ model, relationId, anchor, onClose, notation = "crow", onChange, onDelete, onShowTable }: ErdRelationPopoverProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const r = model.relations.find((x) => x.id === relationId) ?? null;
  const from = r ? tableById(model, r.from.table) : undefined;
  const to = r ? tableById(model, r.to.table) : undefined;
  const open = !!(r && from && to && anchor);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open, relationId]);

  const action = (label: string, key: "onDelete" | "onUpdate") =>
    r && (
      <label className="flex items-center justify-between gap-3">
        <span className="font-mono text-[12px]">{label}</span>
        <Select
          size="sm"
          value={r[key]}
          options={REF_ACTIONS}
          disabled={!onChange}
          onChange={(e) => onChange?.(r.id, { [key]: e.target.value as RefAction })}
        />
      </label>
    );

  return (
    <Floating
      ref={panel}
      open={open}
      onOpenChange={(o) => !o && onClose()}
      anchor={() => anchor}
      side="bottom"
      align="center"
      offset={8}
      role="dialog"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      data-erd-popover=""
      className="w-80 focus-visible:outline-none"
    >
      {r && from && to && (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted pl-3">
            <span id={`${id}-title`} className="flex items-center gap-1 font-bold">
              {from.name} <Icon icon={ArrowRight} label="references" /> {to.name}
            </span>
            <IconButton size="sm" variant="ghost" icon={X} label="Close" onClick={onClose} className="m-0.5 hover:bg-accent" />
          </div>
          <div className="flex flex-col gap-2 p-3 text-[13px]">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">From</dt>
              <dd>
                <button type="button" className="cursor-pointer text-link underline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default" onClick={() => onShowTable?.(from.id)} disabled={!onShowTable}>
                  {qualified(from)}
                </button>{" "}
                <span className="font-mono text-[12px]">({r.from.columns.join(", ")})</span>
              </dd>
              <dt className="text-muted-foreground">To</dt>
              <dd>
                <button type="button" className="cursor-pointer text-link underline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default" onClick={() => onShowTable?.(to.id)} disabled={!onShowTable}>
                  {qualified(to)}
                </button>{" "}
                <span className="font-mono text-[12px]">({r.to.columns.join(", ")})</span>
              </dd>
              <dt className="text-muted-foreground">Cardinality</dt>
              <dd className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">{to.name}</span>
                <ErdCardinalityPicture model={model} relation={r} notation={notation} />
                <span className="text-[12px] text-muted-foreground">{from.name}</span>
              </dd>
            </dl>
            <p>{describeRelation(model, r)}</p>
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              {action("ON DELETE", "onDelete")}
              {action("ON UPDATE", "onUpdate")}
            </div>
            {r.name && (
              <p className="text-[12px] text-muted-foreground">
                Constraint <code className="font-mono">{r.name}</code>
              </p>
            )}
          </div>
          {onDelete && (
            <div className="flex justify-end border-t border-border bg-muted px-3 py-2">
              <Button size="sm" variant="destructive" icon={Trash} onClick={() => onDelete(r.id)}>
                Delete relationship
              </Button>
            </div>
          )}
        </>
      )}
    </Floating>
  );
}
