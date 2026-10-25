"use client";

import { useState } from "react";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Select } from "@/registry/plainspoken/ui/select";
import { Button } from "@/registry/plainspoken/ui/button";
import { cn } from "@/lib/utils";

export interface LibraryResultsBarProps {
  /** Results in all */
  total: number;
  /** First and last on this page */
  from: number;
  to: number;
  /** What was searched for; leave out when browsing everything */
  query?: string;
  /** Filters in force, as chips that remove themselves: "Format: Book" */
  filters?: string[];
  /** The sort order chosen */
  defaultSort?: string;
  className?: string;
}

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "author", label: "Author A–Z" },
  { value: "added", label: "Recently added" },
];

/**
 * The line over search results: how many matched ("1–20 of 64 results for “ocean”", announced
 * when it changes), the filters in force as removable chips with Clear all, and the sort order.
 * A demo: the chips and the sort change here and nowhere else.
 */
export function LibraryResultsBar({ total, from, to, query, filters = [], defaultSort = "relevance", className }: LibraryResultsBarProps) {
  const [chips, setChips] = useState(filters);
  return (
    <div data-slot="library-results-bar" className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p role="status" className="text-[14px]">
          {total === 0 ? (
            "No results"
          ) : (
            <>
              <b className="tabular-nums">
                {from}–{to}
              </b>{" "}
              of <b className="tabular-nums">{total}</b> {total === 1 ? "result" : "results"}
            </>
          )}
          {query ? (
            <>
              {" "}
              for <b>“{query}”</b>
            </>
          ) : (
            " in the catalogue"
          )}
        </p>
        <label className="ctl-sm ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground">
          Sort by
          <Select defaultValue={defaultSort} options={SORTS} className="text-foreground" />
        </label>
      </div>
      {chips.length > 0 && (
        <div className="ctl-sm flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <Chip key={c} onRemove={() => setChips((x) => x.filter((y) => y !== c))}>
              {c}
            </Chip>
          ))}
          <Button variant="link" size="sm" onClick={() => setChips([])}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
