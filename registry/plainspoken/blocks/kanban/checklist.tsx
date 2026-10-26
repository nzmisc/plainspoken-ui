"use client";

import { useId, useRef, useState } from "react";
import { ListChecks, Plus, X } from "@/registry/plainspoken/lib/icons";
import type { ChecklistItem } from "@/registry/plainspoken/blocks/kanban/data";
import { newId } from "@/registry/plainspoken/blocks/kanban/format";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { cn } from "@/lib/utils";

export interface KanbanChecklistProps {
  /** The items. Leave out (and use defaultItems) to let the checklist keep its own. */
  items?: ChecklistItem[];
  defaultItems?: ChecklistItem[];
  onToggle?: (item: ChecklistItem, done: boolean) => void;
  onAdd?: (item: ChecklistItem) => void;
  onRemove?: (item: ChecklistItem) => void;
  /** No adding, removing or ticking: a finished card, or someone without edit rights */
  readOnly?: boolean;
  /** Heading level of "Checklist" in the page's outline. Default 3. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * A card's checklist: a heading with "3 of 5" and a progress bar, the items as checkboxes (ticked
 * ones struck through), a × to remove each, and a box to add one more (Enter adds it and keeps the
 * box for the next). Removing an item moves focus to the next one, or to the box, so it is never lost.
 */
export function KanbanChecklist({ items, defaultItems = [], onToggle, onAdd, onRemove, readOnly = false, headingLevel = 3, className }: KanbanChecklistProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultItems);
  const list = items ?? own;
  const [text, setText] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const done = list.filter((i) => i.done).length;
  const H = `h${headingLevel}` as "h3";

  const change = (next: ChecklistItem[]) => {
    if (!items) setOwn(next);
  };
  const add = () => {
    const t = text.trim();
    if (!t) return;
    const item = { id: newId("c"), text: t, done: false };
    change([...list, item]);
    onAdd?.(item);
    setText("");
  };
  const remove = (item: ChecklistItem, i: number) => {
    change(list.filter((x) => x.id !== item.id));
    onRemove?.(item);
    // The next item's box (or the previous, or the add box) takes focus, once React has removed this one
    const next = list[i + 1] ?? list[i - 1];
    requestAnimationFrame(() => {
      const el = next ? root.current?.querySelector<HTMLInputElement>(`[data-item="${next.id}"]`) : null;
      (el ?? box.current)?.focus();
    });
  };

  return (
    <div ref={root} data-slot="kanban-checklist" className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline gap-2">
        <H id={`${id}-h`} className="flex items-center gap-1.5 text-[14px] font-bold">
          <Icon icon={ListChecks} className="text-muted-foreground" />
          Checklist
        </H>
        {list.length > 0 && (
          <span className={cn("text-[13px] tabular-nums", done === list.length ? "text-success" : "text-muted-foreground")}>
            {done} of {list.length} done
          </span>
        )}
      </div>
      {list.length > 0 && <Progress value={done} max={list.length} label="Checklist done" showValue={false} />}
      {list.length > 0 ? (
        <ul aria-labelledby={`${id}-h`} className="flex flex-col">
          {list.map((item, i) => (
            <li key={item.id} className="group/item flex items-start justify-between gap-2 border-b border-border last:border-b-0 hover:bg-muted">
              <Checkbox
                data-item={item.id}
                checked={item.done}
                disabled={readOnly}
                onChange={(e) => {
                  change(list.map((x) => (x.id === item.id ? { ...x, done: e.target.checked } : x)));
                  onToggle?.(item, e.target.checked);
                }}
                label={<span className={cn(item.done && "text-muted-foreground line-through")}>{item.text}</span>}
                className="min-w-0 flex-1 py-0.5 pl-0.5"
              />
              {!readOnly && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={X}
                  label={`Remove “${item.text}”`}
                  onClick={() => remove(item, i)}
                  className="mt-1 text-muted-foreground opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">No checklist yet. Break the work into steps to see how far along it is.</p>
      )}
      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="ctl-sm flex gap-1"
        >
          <Input ref={box} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item" aria-label="New checklist item" className="min-w-0 flex-1" />
          <Button type="submit" icon={Plus} disabled={!text.trim()}>
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
