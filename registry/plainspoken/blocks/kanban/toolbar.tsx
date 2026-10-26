"use client";

import { useState, type Ref } from "react";
import { FunnelX, Search, Tag, Users } from "@/registry/plainspoken/lib/icons";
import { LABELS, ME, PEOPLE, type BoardLabel, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { EMPTY_FILTER, isFiltering, personById, type BoardFilter } from "@/registry/plainspoken/blocks/kanban/format";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Input } from "@/registry/plainspoken/ui/input";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { cn } from "@/lib/utils";

export interface KanbanToolbarProps {
  /** The filter. Leave out (and use defaultFilter) to let the toolbar keep its own. */
  filter?: BoardFilter;
  defaultFilter?: BoardFilter;
  onFilterChange?: (filter: BoardFilter) => void;
  /** People to filter by in the Assignee panel: those with cards, say */
  people?: Person[];
  labels?: BoardLabel[];
  /** The viewer, for "My cards" */
  me?: string;
  /** Cards that pass the filter and cards on the board, for "12 of 27 cards" */
  shown?: number;
  total?: number;
  /** The search box, so a page shortcut (/) can focus it */
  searchRef?: Ref<HTMLInputElement>;
  className?: string;
}

const toggle = <T,>(list: T[], value: T, on: boolean) => (on ? [...list, value] : list.filter((v) => v !== value));

/**
 * The strip over a board: a search box (every word must match the title, key, description or a
 * label), Assignee and Label filters that open a panel of checkboxes (people with their round
 * avatars, labels with their colour), a "My cards" toggle, a removable chip for each person
 * filtered by (however they were chosen), Clear filters, and how many cards
 * pass, said politely to screen readers as it changes. The filter buttons turn bold with a dark
 * edge while set, and say how many are chosen, so it never rests on colour.
 */
export function KanbanToolbar({
  filter: filterProp,
  defaultFilter = EMPTY_FILTER,
  onFilterChange,
  people = PEOPLE,
  labels = LABELS,
  me = ME,
  shown,
  total,
  searchRef,
  className,
}: KanbanToolbarProps) {
  const [own, setOwn] = useState(defaultFilter);
  const f = filterProp ?? own;
  const set = (patch: Partial<BoardFilter>) => {
    const next = { ...f, ...patch };
    if (!filterProp) setOwn(next);
    onFilterChange?.(next);
  };
  const filtering = isFiltering(f);

  return (
    <div data-slot="kanban-toolbar" role="search" aria-label="Filter cards" className={cn("ctl-sm flex flex-wrap items-center gap-1.5", className)}>
      <Input
        ref={searchRef}
        type="search"
        prefix={Search}
        suffix={<Kbd className="mr-1 max-sm:hidden">/</Kbd>}
        value={f.query}
        onChange={(e) => set({ query: e.target.value })}
        placeholder="Search cards"
        aria-label="Search cards"
        className="w-60 max-sm:w-full"
      />
      <MenuButton
        icon={Users}
        label={f.people.length ? `Assignee: ${f.people.length}` : "Assignee"}
        active={f.people.length > 0}
        panelClassName="w-60 ctl-md"
      >
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-[12px] font-bold text-muted-foreground">Cards assigned to</legend>
          {people.map((p) => (
            <Checkbox
              key={p.id}
              checked={f.people.includes(p.id)}
              onChange={(e) => set({ people: toggle(f.people, p.id, e.target.checked) })}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={p.name} src={p.picture} shape="circle" size={20} aria-hidden />
                  {p.name}
                  {p.id === me && <span className="text-muted-foreground">(you)</span>}
                </span>
              }
            />
          ))}
          <Checkbox checked={f.people.includes("none")} onChange={(e) => set({ people: toggle(f.people, "none", e.target.checked) })} label="Nobody yet" />
        </fieldset>
      </MenuButton>
      <MenuButton
        icon={Tag}
        label={f.labels.length ? `Label: ${f.labels.length}` : "Label"}
        active={f.labels.length > 0}
        panelClassName="w-52 ctl-md"
      >
        <fieldset className="flex flex-col">
          <legend className="mb-1 text-[12px] font-bold text-muted-foreground">Cards labelled</legend>
          {labels.map((l) => (
            <Checkbox
              key={l.id}
              checked={f.labels.includes(l.id)}
              onChange={(e) => set({ labels: toggle(f.labels, l.id, e.target.checked) })}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Swatch color={l.color} />
                  {l.label}
                </span>
              }
            />
          ))}
        </fieldset>
      </MenuButton>
      <Chip pressed={f.mine} onPressedChange={(mine) => set({ mine })}>
        My cards
      </Chip>
      {f.involved && (
        <Chip name={`the filter for ${personById(f.involved).name}`} onRemove={() => set({ involved: null })}>
          <span className="inline-flex items-center gap-1">
            <Avatar name={personById(f.involved).name} src={personById(f.involved).picture} shape="circle" size={16} aria-hidden />
            Cards with {personById(f.involved).name}
          </span>
        </Chip>
      )}
      {f.people.map((id) => {
        const p = id === "none" ? null : (people.find((x) => x.id === id) ?? personById(id));
        const name = p ? `${p.name}${p.id === me ? " (you)" : ""}` : "Nobody yet";
        return (
          <Chip key={id} name={`the filter for ${name}`} onRemove={() => set({ people: f.people.filter((x) => x !== id) })}>
            <span className="inline-flex items-center gap-1">
              {p && <Avatar name={p.name} src={p.picture} shape="circle" size={16} aria-hidden />}
              {name}
            </span>
          </Chip>
        );
      })}
      {filtering && (
        <Button variant="ghost" icon={FunnelX} onClick={() => set(EMPTY_FILTER)}>
          Clear filters
        </Button>
      )}
      {total != null && (
        <p aria-live="polite" className="ml-auto text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
          {filtering && shown != null ? `${shown} of ${total} cards` : `${total} cards`}
        </p>
      )}
    </div>
  );
}
