"use client";

import { useState } from "react";
import { SlidersHorizontal } from "@/registry/plainspoken/lib/icons";
import { Accordion, AccordionItem } from "@/registry/plainspoken/ui/accordion";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Field } from "@/registry/plainspoken/ui/field";
import { NumberField } from "@/registry/plainspoken/ui/number-field";
import { Select } from "@/registry/plainspoken/ui/select";
import { Switch } from "@/registry/plainspoken/ui/switch";
import { cn } from "@/lib/utils";

export interface FacetOption {
  value: string;
  label: string;
  /** Results with this value */
  count: number;
}

export interface FacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
}

export interface LibraryFacetsProps {
  groups: FacetGroup[];
  /** Publication years the results span */
  years: { min: number; max: number };
  branches: { id: string; name: string }[];
  /** Values ticked at first, by group key */
  defaultSelected?: Record<string, string[]>;
  /** Groups open at first; the rest start closed */
  defaultOpen?: string[];
  /** Options shown before "Show more" */
  visible?: number;
  className?: string;
}

/** Ticked values per group, the year range, the branch and "available now": the whole filter state */
interface State {
  ticked: Record<string, string[]>;
  from: number | null;
  to: number | null;
  branch: string;
  availableOnly: boolean;
}

function FacetList({ group, ticked, onToggle, visible }: { group: FacetGroup; ticked: string[]; onToggle: (v: string) => void; visible: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? group.options : group.options.slice(0, visible);
  return (
    <div className="ctl-sm flex flex-col">
      {shown.map((o) => (
        <Checkbox
          key={o.value}
          checked={ticked.includes(o.value)}
          onChange={() => onToggle(o.value)}
          label={
            <span className="flex justify-between gap-3">
              <span>{o.label}</span>
              <span className="text-muted-foreground tabular-nums">{o.count}</span>
            </span>
          }
          className="w-full [&>span]:flex-1"
        />
      ))}
      {group.options.length > visible && (
        <Button variant="link" size="sm" className="self-start" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? "Show fewer" : `Show ${group.options.length - visible} more`}
        </Button>
      )}
    </div>
  );
}

/**
 * The filters beside catalogue results: available now, then a section per facet (format,
 * subject, audience, language) with a count for each value, the publication years and a branch.
 * Sections open and close (plain <details>), long lists fold behind "Show more". On phones the
 * whole panel moves into a drawer behind a Filters button that says how many are on. A demo: the
 * choices are kept here and change nothing else.
 */
export function LibraryFacets({ groups, years, branches, defaultSelected = {}, defaultOpen, visible = 6, className }: LibraryFacetsProps) {
  const fresh: State = { ticked: defaultSelected, from: null, to: null, branch: "", availableOnly: false };
  const [s, setS] = useState<State>(fresh);
  const [drawer, setDrawer] = useState(false);
  const active =
    Object.values(s.ticked).reduce((n, v) => n + v.length, 0) + (s.from != null || s.to != null ? 1 : 0) + (s.branch ? 1 : 0) + (s.availableOnly ? 1 : 0);
  const toggle = (key: string, v: string) =>
    setS((p) => {
      const cur = p.ticked[key] ?? [];
      return { ...p, ticked: { ...p.ticked, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } };
    });
  const open = defaultOpen ?? groups.slice(0, 2).map((g) => g.key);

  const panel = (
    <div className="flex flex-col gap-3">
      <Switch checked={s.availableOnly} onChange={(v) => setS((p) => ({ ...p, availableOnly: v }))} label="Available now" description="On a shelf, or ready to borrow online" />
      <Accordion>
        {groups.map((g) => {
          const n = s.ticked[g.key]?.length ?? 0;
          return (
            <AccordionItem key={g.key} title={g.label} meta={n ? `${n} chosen` : undefined} defaultOpen={open.includes(g.key)}>
              <FacetList group={g} ticked={s.ticked[g.key] ?? []} onToggle={(v) => toggle(g.key, v)} visible={visible} />
            </AccordionItem>
          );
        })}
        <AccordionItem title="Publication year" meta={s.from != null || s.to != null ? `${s.from ?? years.min}–${s.to ?? years.max}` : undefined}>
          <div className="ctl-sm flex items-end gap-2">
            <Field label="From">
              <NumberField value={s.from} onChange={(v) => setS((p) => ({ ...p, from: v }))} min={years.min} max={years.max} placeholder={String(years.min)} inputClassName="w-[5ch]" />
            </Field>
            <Field label="To">
              <NumberField value={s.to} onChange={(v) => setS((p) => ({ ...p, to: v }))} min={years.min} max={years.max} placeholder={String(years.max)} inputClassName="w-[5ch]" />
            </Field>
          </div>
        </AccordionItem>
      </Accordion>
      <Field label="Branch">
        <Select
          value={s.branch}
          onChange={(e) => setS((p) => ({ ...p, branch: e.target.value }))}
          options={[{ value: "", label: "Any branch" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
        />
      </Field>
    </div>
  );

  return (
    <div data-slot="library-facets" className={cn("min-w-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 max-md:hidden">
        <h2 className="text-[15px] font-bold">Refine results</h2>
        {active > 0 && (
          <Button variant="link" size="sm" onClick={() => setS({ ...fresh, ticked: {} })}>
            Clear all
          </Button>
        )}
      </div>
      <div className="max-md:hidden">{panel}</div>
      <div className="md:hidden">
        <Button icon={SlidersHorizontal} onClick={() => setDrawer(true)}>
          Filters{active > 0 && ` (${active})`}
        </Button>
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          side="left"
          title="Refine results"
          footer={
            <>
              <Button onClick={() => setS({ ...fresh, ticked: {} })}>Clear all</Button>
              <Button variant="primary" onClick={() => setDrawer(false)}>
                Show results
              </Button>
            </>
          }
        >
          {panel}
        </Drawer>
      </div>
    </div>
  );
}
