"use client";

import { useState, type Ref } from "react";
import { ChevronDown, Search } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { Person } from "@/registry/plainspoken/blocks/mail/data";
import { filtersActive, NO_FILTERS, type MailFilters } from "@/registry/plainspoken/blocks/mail/format";
import { Button } from "@/registry/plainspoken/ui/button";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { cn } from "@/lib/utils";

export interface MailSearchProps {
  /** What the box says at first */
  defaultQuery?: string;
  /** Which filters are on at first */
  defaultFilters?: MailFilters;
  /** Called as the text or the filters change, to search with them */
  onChange?: (query: string, filters: MailFilters) => void;
  /** Who the "From" filter offers: the senders in the folder */
  senders: Person[];
  /** "Search Inbox" */
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}

/**
 * The search box over a message list, with filter chips under it: Unread and Has attachment
 * toggle; From picks a sender from a menu and then shows as a chip with a × to clear it. The "/"
 * in the box is the usual shortcut to get there. A filter that is on says so in words (the chip is
 * pressed, or reads "From: Marta Kowalska"), not only in colour, and Clear resets everything.
 */
export function MailSearch({ defaultQuery = "", defaultFilters = NO_FILTERS, onChange, senders, placeholder = "Search mail", inputRef, className }: MailSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [filters, setFilters] = useState(defaultFilters);
  const from = senders.find((s) => s.email === filters.from);
  const update = (q: string, f: MailFilters) => {
    setQuery(q);
    setFilters(f);
    onChange?.(q, f);
  };
  const set = (patch: Partial<MailFilters>) => update(query, { ...filters, ...patch });
  return (
    <div data-slot="mail-search" role="search" className={cn("flex flex-col gap-1.5", className)}>
      <Input
        ref={inputRef}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        prefix={Search}
        suffix={query ? undefined : <Kbd className="mr-1 text-[11px] text-muted-foreground">/</Kbd>}
        value={query}
        onChange={(e) => update(e.target.value, filters)}
        className="w-full"
      />
      <div className="ctl-sm flex flex-wrap items-center gap-1" role="group" aria-label="Filters">
        <Chip pressed={filters.unread} onPressedChange={(unread) => set({ unread })}>
          Unread
        </Chip>
        <Chip pressed={filters.attachment} onPressedChange={(attachment) => set({ attachment })}>
          Has attachment
        </Chip>
        {from ? (
          <Chip onRemove={() => set({ from: null })} name={`From: ${from.name}`} className="border-foreground font-medium">
            From: {from.name}
          </Chip>
        ) : (
          <DropdownMenu
            size="sm"
            items={[{ type: "label", label: "Only mail from" }, ...senders.map((s) => ({ label: s.name, hint: s.email, onSelect: () => set({ from: s.email }) }))]}
            trigger={(props) => (
              <button
                {...props}
                className={cn(
                  "inline-flex h-(--ctl-h) cursor-pointer items-center gap-1 border border-border bg-background px-(--ctl-px) text-(length:--ctl-text) leading-none whitespace-nowrap hover:bg-secondary [&_svg]:size-(--ctl-icon)",
                  FOCUS_RING,
                )}
              >
                From
                <Icon icon={ChevronDown} className="text-muted-foreground" />
              </button>
            )}
          />
        )}
        {(query || filtersActive(filters)) && (
          <Button variant="link" onClick={() => update("", NO_FILTERS)} className="ml-1">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
