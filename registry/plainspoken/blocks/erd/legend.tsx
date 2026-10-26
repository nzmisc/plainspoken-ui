import type { ReactNode } from "react";
import { Key, Link, X } from "@/registry/plainspoken/lib/icons";
import { END_LABEL } from "@/registry/plainspoken/blocks/erd/geometry";
import type { EndKind, ErdSchemaInfo } from "@/registry/plainspoken/blocks/erd/model";
import { ErdEndMark } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

const ENDS: { kind: EndKind; words: string }[] = [
  { kind: "one", words: "exactly one" },
  { kind: "zero-or-one", words: "zero or one" },
  { kind: "zero-or-many", words: "zero or many" },
  { kind: "many", words: "one or many" },
];

const MARKS: { mark: ReactNode; words: string }[] = [
  { mark: <Icon icon={Key} className="size-3 text-warning" />, words: "primary key" },
  { mark: <Icon icon={Link} className="size-3 text-muted-foreground" />, words: "foreign key" },
  { mark: "UQ", words: "unique" },
  { mark: "DEF", words: "has a default" },
  { mark: "ID", words: "identity" },
  { mark: "IDX", words: "indexed" },
  { mark: "NULL", words: "may be null" },
];

export interface ErdLegendProps {
  /** Which notation to explain */
  notation?: "crow" | "labels";
  /** The schemas and their colours */
  schemas?: ErdSchemaInfo[];
  /** Shows a × */
  onClose?: () => void;
  className?: string;
}

/**
 * What the marks mean: the line ends (crow's foot bars, circles and feet, or the 1 and N labels),
 * the column marks (keys, UQ, DEF, ID, IDX, NULL) and the schema colours. Small enough to sit on
 * the canvas.
 */
export function ErdLegend({ notation = "crow", schemas = [], onClose, className }: ErdLegendProps) {
  return (
    <section data-slot="erd-legend" aria-label="Legend" className={cn("w-56 border border-border bg-background text-[12px]", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted pl-2">
        <h2 className="text-[13px] font-bold">Legend</h2>
        {onClose && <IconButton size="xs" variant="ghost" icon={X} label="Hide the legend" onClick={onClose} className="m-0.5 hover:bg-accent" />}
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div>
          <h3 className="mb-0.5 font-semibold">Line ends</h3>
          <ul className="flex flex-col gap-0.5">
            {ENDS.filter((e) => notation === "crow" || e.kind !== "many").map((e) => (
              <li key={e.kind} className="flex items-center gap-2">
                {notation === "crow" ? (
                  <svg aria-hidden width={40} height={14} viewBox="0 -7 40 14" className="shrink-0 overflow-visible">
                    <g className="stroke-foreground" strokeWidth={1.25} fill="none" strokeLinecap="round">
                      <path d="M1,-7 V7" className="stroke-border" strokeWidth={2} />
                      <path d="M1,0 H40" />
                      <ErdEndMark kind={e.kind} x={1} y={0} side="right" />
                    </g>
                  </svg>
                ) : (
                  <b className="w-10 shrink-0 font-sans">{END_LABEL[e.kind]}</b>
                )}
                <span>{e.words}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-muted-foreground">The foot is at the table that holds the foreign key.</p>
        </div>
        <div>
          <h3 className="mb-0.5 font-semibold">Columns</h3>
          <ul className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5">
            {MARKS.map((m) => (
              <li key={m.words} className="contents">
                <span className="flex justify-center">
                  {typeof m.mark === "string" ? (
                    <span className={cn("border border-border px-[3px] text-[10px] leading-[14px] font-medium text-muted-foreground", m.mark === "NULL" && "border-dashed")}>{m.mark}</span>
                  ) : (
                    m.mark
                  )}
                </span>
                <span>{m.words}</span>
              </li>
            ))}
          </ul>
        </div>
        {schemas.length > 0 && (
          <div>
            <h3 className="mb-0.5 font-semibold">Schemas</h3>
            <ul className="flex flex-col gap-0.5">
              {schemas.map((s) => (
                <li key={s.name} className="flex items-center gap-1.5">
                  <Swatch color={s.color} />
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
