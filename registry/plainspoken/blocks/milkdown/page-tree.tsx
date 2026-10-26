"use client";

import { BookOpen, ChartLine, File, FileCode, Folder, Library, Plus, Rocket, Search, TriangleAlert, Users, type Glyph } from "@/registry/plainspoken/lib/icons";
import { SECTIONS, TEMPLATES, type NotebookPage, type PageKind, type PageTemplate } from "@/registry/plainspoken/blocks/milkdown/data";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Input } from "@/registry/plainspoken/ui/input";
import type { SidebarItem, SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

/** The icon of each kind of page, in the tree and in New page */
export const KIND_ICONS: Record<PageKind, Glyph> = {
  start: Rocket,
  rfc: FileCode,
  runbook: BookOpen,
  incident: TriangleAlert,
  notes: Users,
  plan: ChartLine,
  reference: Library,
  page: File,
};

const pageItem = (p: NotebookPage, hits?: number): SidebarItem => ({
  key: p.id,
  label: p.title || "Untitled",
  href: `#${p.id}`,
  icon: KIND_ICONS[p.kind],
  ...(hits ? { badge: hits, badgeLabel: hits === 1 ? "1 match" : `${hits} matches` } : {}),
});

/**
 * The notebook as Sidebar sections: its parts in order, each page with its kind's icon and the
 * folders in a part as groups that open in place. With search results (from searchPages) it is one
 * flat list of the pages that match, each with how often.
 */
export function notebookSections(pages: NotebookPage[], matches?: Map<string, number> | null): SidebarSection[] {
  if (matches) {
    const found = pages.filter((p) => matches.has(p.id));
    return found.length ? [{ key: "results", heading: `${found.length} ${found.length === 1 ? "page" : "pages"}`, items: found.map((p) => pageItem(p, matches.get(p.id))) }] : [];
  }
  return SECTIONS.map((section) => {
    const items: SidebarItem[] = [];
    for (const p of pages.filter((x) => x.section === section.key)) {
      if (!p.folder) {
        items.push(pageItem(p));
        continue;
      }
      const key = `${section.key}/${p.folder}`;
      let folder = items.find((i) => i.key === key);
      if (!folder) items.push((folder = { key, label: p.folder, icon: Folder, children: [] }));
      folder.children!.push(pageItem(p));
    }
    return { key: section.key, heading: section.heading, items };
  }).filter((s) => s.items.length);
}

export interface PageSearchProps {
  value: string;
  onChange: (query: string) => void;
  /** How many pages match, read out as it changes; null while there is no query */
  count: number | null;
  className?: string;
}

/**
 * Search over the pages' titles and text, for the top of the sidebar. Escape clears it; the number
 * of pages found is announced as it changes.
 */
export function PageSearch({ value, onChange, count, className }: PageSearchProps) {
  return (
    <div data-slot="notebook-page-search" className={className}>
      <Input
        type="search"
        aria-label="Search pages"
        placeholder="Search pages"
        prefix={Search}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
      />
      <p aria-live="polite" className="sr-only">
        {count == null ? "" : count === 0 ? "No pages match" : count === 1 ? "1 page matches" : `${count} pages match`}
      </p>
    </div>
  );
}

export interface NewPageMenuProps {
  onCreate: (template: PageTemplate) => void;
  /** What to start from. Default: the notebook's (Blank, RFC, Runbook, Incident review, Meeting notes). */
  templates?: PageTemplate[];
  /** A square icon button, for the sidebar's rail */
  compact?: boolean;
  /** Classes for the button */
  className?: string;
}

/** New page: a menu of templates, each with a line on what it is for */
export function NewPageMenu({ onCreate, templates = TEMPLATES, compact = false, className }: NewPageMenuProps) {
  return (
    <DropdownMenu
      label="New page"
      className="w-72"
      items={templates.map((t) => ({ label: t.label, hint: t.hint, icon: t.icon, onSelect: () => onCreate(t) }))}
      trigger={(props) =>
        compact ? (
          <IconButton {...props} variant="primary" size="sm" icon={Plus} label="New page" className={className} />
        ) : (
          <Button {...props} variant="primary" icon={Plus} block className={className}>
            New page
          </Button>
        )
      }
    />
  );
}

export interface PageTreeHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Pages matching the query, or null without one */
  count: number | null;
  onCreate: (template: PageTemplate) => void;
  /** The sidebar is a rail: only New page shows */
  rail?: boolean;
  className?: string;
}

/** The top of the page tree: New page and the search box (just New page in the rail) */
export function PageTreeHeader({ query, onQueryChange, count, onCreate, rail = false, className }: PageTreeHeaderProps) {
  if (rail) return <NewPageMenu compact onCreate={onCreate} className={className} />;
  return (
    <div data-slot="notebook-page-tree-header" className={cn("flex flex-col gap-2", className)}>
      <NewPageMenu onCreate={onCreate} />
      <PageSearch value={query} onChange={onQueryChange} count={count} />
      {count === 0 && <p className="px-1 text-[13px] text-muted-foreground">No pages match “{query.trim()}”.</p>}
    </div>
  );
}
