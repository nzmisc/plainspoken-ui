"use client";

import { useState, type ReactNode } from "react";
import { Search, X } from "@/registry/plainspoken/lib/icons";
import { qualified, type ErdModel } from "@/registry/plainspoken/blocks/erd/model";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { cn } from "@/lib/utils";

export interface ErdTableListProps {
  model: ErdModel;
  /** Selected tables, marked in the list */
  selected?: readonly string[];
  /** A table was picked: select it and bring it into view */
  onPick: (id: string) => void;
  /** Controlled search text */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (q: string) => void;
  /** Under the list, e.g. an Add table button */
  footer?: ReactNode;
  className?: string;
}

/**
 * Every table of the schema, grouped by schema under its colour, with a search box that matches
 * table and column names (and says which column matched). Picking one calls `onPick`, which in the
 * ERD app selects it and pans and zooms the canvas to it. A plain list of buttons, so the whole
 * schema can be gone through without the canvas.
 */
export function ErdTableList({ model, selected = [], onPick, query: queryProp, defaultQuery = "", onQueryChange, footer, className }: ErdTableListProps) {
  const [own, setOwn] = useState(defaultQuery);
  const query = queryProp ?? own;
  const setQuery = (q: string) => {
    setOwn(q);
    onQueryChange?.(q);
  };
  const q = query.trim().toLowerCase();
  const groups = model.schemas
    .map((s) => ({
      schema: s,
      tables: model.tables
        .filter((t) => t.schema === s.name)
        .map((t) => ({ t, column: q && !qualified(t).toLowerCase().includes(q) ? t.columns.find((c) => c.name.toLowerCase().includes(q))?.name : undefined }))
        .filter(({ t, column }) => !q || qualified(t).toLowerCase().includes(q) || column),
    }))
    .filter((g) => g.tables.length);
  const count = groups.reduce((n, g) => n + g.tables.length, 0);

  return (
    <div data-slot="erd-table-list" className={cn("flex min-h-0 flex-col", className)}>
      <div className="border-b border-border p-2">
        <Input
          type="search"
          size="sm"
          aria-label="Find a table or column"
          placeholder="Find a table or column"
          prefix={Search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.preventDefault();
              setQuery("");
            }
          }}
          suffix={query ? <IconButton size="xs" variant="ghost" icon={X} label="Clear the search" onClick={() => setQuery("")} /> : undefined}
          className="w-full"
          inputClassName="[&::-webkit-search-cancel-button]:hidden"
        />
        <p className="mt-1 text-[12px] text-muted-foreground" aria-live="polite">
          {q ? `${count} of ${model.tables.length} tables` : `${model.tables.length} tables, ${model.relations.length} relations`}
        </p>
      </div>
      <nav aria-label="Tables" className="min-h-0 flex-1 overflow-y-auto py-1">
        {groups.length === 0 && <p className="px-3 py-2 text-[13px] text-muted-foreground">{q ? `Nothing matches “${query}”.` : "No tables yet."}</p>}
        {groups.map(({ schema, tables }) => (
          <section key={schema.name} aria-labelledby={`erd-list-${schema.name}`} className="pb-1">
            <h3 id={`erd-list-${schema.name}`} className="flex items-center gap-1.5 px-3 pt-1.5 pb-0.5 text-[12px] font-bold text-muted-foreground">
              <Swatch color={schema.color} />
              {schema.name}
              <span className="font-normal tabular-nums">{tables.length}</span>
            </h3>
            <ul>
              {tables.map(({ t, column }) => {
                const on = selected.includes(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-current={on || undefined}
                      onClick={() => onPick(t.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-baseline gap-2 px-3 py-[3px] text-left text-[13px] hover:bg-secondary",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                        on && "bg-accent font-bold hover:bg-accent",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {t.name}
                        {column && <span className="ml-1.5 font-mono text-[12px] font-normal text-muted-foreground">.{column}</span>}
                      </span>
                      <span className="shrink-0 text-[12px] font-normal text-muted-foreground tabular-nums" title={`${t.columns.length} columns`}>
                        {t.columns.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
      {footer && <div className="border-t border-border p-2">{footer}</div>}
    </div>
  );
}
