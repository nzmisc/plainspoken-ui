"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "@/registry/plainspoken/lib/icons";
import { currentKeyFor, navClick, type LinkComponent } from "@/registry/plainspoken/lib/nav";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { useModal } from "@/registry/plainspoken/ui/dialog";
import { renderIcon, type IconLike } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/** A sidebar entry. One with children is a group that opens in place; the rest are links. */
export interface SidebarItem {
  key: string;
  label: string;
  href?: string;
  /** Before the label, and alone in the rail. A glyph, or an element (a coloured square for a mail label). */
  icon?: IconLike;
  /** Short marker after the label: an unread count, "new", "!" */
  badge?: ReactNode;
  /** What the badge means, read out instead of it: "12 unread". Without it the badge is read as it is. */
  badgeLabel?: string;
  children?: SidebarItem[];
}

export interface SidebarSection {
  key: string;
  /** Small heading over the section; leave out for a plain group (the rail shows a divider either way) */
  heading?: string;
  /** Beside the heading, e.g. an xs IconButton "New playlist". Not shown in the rail. */
  action?: ReactNode;
  items: SidebarItem[];
}

/** The navigation props the sidebar, the drawer and the app shell share */
export interface SidebarNavProps {
  sections: SidebarSection[];
  /** Key of the item for the current page */
  current?: string;
  /** Or the current pathname (from your router); the best-matching item is marked. `current` wins. */
  currentHref?: string;
  /** Plain left clicks on items go here instead of the browser, e.g. `(key) => setFolder(key)` */
  onNavigate?: (key: string, href: string) => void;
  /** Draw links with your router's link component, e.g. next/link's `Link`. Default: a plain <a>. */
  linkAs?: LinkComponent;
}

/** A slot that can change with the rail: a node (shown only when expanded) or `(rail) => node` */
export type SidebarSlot = ReactNode | ((rail: boolean) => ReactNode);

const slot = (s: SidebarSlot, rail: boolean): ReactNode => (typeof s === "function" ? s(rail) : rail ? null : s);

const holds = (item: SidebarItem, key?: string): boolean =>
  key != null && (item.key === key || (item.children ?? []).some((c) => holds(c, key)));

const firstLink = (item: SidebarItem): SidebarItem | undefined =>
  item.href ? item : (item.children ?? []).map(firstLink).find(Boolean);

function flatten(items: SidebarItem[]): SidebarItem[] {
  return items.flatMap((i) => [i, ...flatten(i.children ?? [])]);
}

/** The key of the current item, from `current` or matched from `currentHref` */
export function sidebarCurrentKey(sections: SidebarSection[], current?: string, currentHref?: string): string | undefined {
  return current ?? currentKeyFor(flatten(sections.flatMap((s) => s.items)), currentHref);
}

interface ListProps extends SidebarNavProps {
  /** Icons only; labels stay for screen readers and as tooltips */
  rail?: boolean;
  /** Taller rows, for touch (the drawer) */
  roomy?: boolean;
  /** Called after a link is followed, e.g. to close the drawer */
  afterNavigate?: () => void;
}

const ROW = "relative flex w-full items-center gap-2 text-left text-[14px] leading-tight";
const LINK = "text-foreground no-underline visited:text-foreground";
const CURRENT = "bg-accent font-bold before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground";

function rowClass(p: { roomy?: boolean; rail?: boolean }) {
  return cn(ROW, p.roomy ? "min-h-10 px-3 py-1.5" : "min-h-7 px-2 py-1", p.rail && "justify-center px-0", FOCUS_RING, "focus-visible:-outline-offset-2");
}

function ItemIcon({ item, rail }: { item: SidebarItem; rail?: boolean }) {
  if (!item.icon && !rail) return null;
  return (
    <span aria-hidden className="inline-flex w-4 shrink-0 justify-center [&_svg]:size-4">
      {item.icon ? renderIcon(item.icon) : <span className="text-[12px] font-medium">{item.label.slice(0, 1)}</span>}
    </span>
  );
}

function Badge({ item, rail }: { item: SidebarItem; rail?: boolean }) {
  if (item.badge == null || item.badge === false) return null;
  const words = item.badgeLabel ?? (typeof item.badge === "string" || typeof item.badge === "number" ? String(item.badge) : undefined);
  if (rail)
    return (
      <>
        <span aria-hidden className="absolute top-1 right-1.5 size-1.5 bg-foreground" />
        {words && <span className="sr-only">, {words}</span>}
      </>
    );
  return (
    <>
      <span aria-hidden={item.badgeLabel ? true : undefined} className="ml-auto shrink-0 pl-2 text-[12px] font-normal tabular-nums text-muted-foreground">
        {item.badge}
      </span>
      {item.badgeLabel && <span className="sr-only">, {item.badgeLabel}</span>}
    </>
  );
}

type ItemProps = Omit<ListProps, "sections" | "current" | "currentHref"> & { item: SidebarItem; depth: number; currentKey?: string };

function Item({ item, depth, currentKey, ...p }: ItemProps) {
  const L = p.linkAs ?? "a";
  const inside = holds(item, currentKey);
  const [open, setOpen] = useState(inside);
  // A group opens when the current page moves into it (navigating from elsewhere), and stays as
  // the user left it otherwise.
  const [wasInside, setWasInside] = useState(inside);
  if (inside !== wasInside) {
    setWasInside(inside);
    if (inside) setOpen(true);
  }
  const groupId = useId();
  const indent: CSSProperties | undefined = p.rail || depth === 0 ? undefined : { paddingLeft: (p.roomy ? 12 : 8) + depth * 24 };

  if (item.children?.length && !p.rail) {
    return (
      <li>
        <button
          type="button"
          className={cn(rowClass(p), "cursor-pointer hover:bg-secondary", !open && inside && "font-bold")}
          style={indent}
          aria-expanded={open}
          aria-controls={groupId}
          onClick={() => setOpen((o) => !o)}
        >
          <ItemIcon item={item} />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          <span aria-hidden className="inline-flex text-muted-foreground [&_svg]:size-3.5">
            {renderIcon(open ? ChevronDown : ChevronRight)}
          </span>
        </button>
        <ul id={groupId} hidden={!open}>
          {item.children.map((c) => (
            <Item key={c.key} item={c} depth={depth + 1} currentKey={currentKey} {...p} />
          ))}
        </ul>
      </li>
    );
  }

  // In the rail a group becomes one link, to its first page, marked when it holds the current page.
  const target = item.children?.length ? firstLink(item) : item;
  const on = p.rail ? inside : item.key === currentKey;
  const content = (
    <>
      <ItemIcon item={item} rail={p.rail} />
      <span className={p.rail ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      <Badge item={item} rail={p.rail} />
    </>
  );
  const tip = p.rail ? [item.label, item.badgeLabel ?? (typeof item.badge === "number" || typeof item.badge === "string" ? item.badge : null)].filter((x) => x != null).join(", ") : undefined;
  return (
    <li>
      {target?.href ? (
        <L
          href={target.href}
          aria-current={on ? (item.key === currentKey ? "page" : "true") : undefined}
          title={tip}
          className={cn(rowClass(p), LINK, on ? CURRENT : "hover:bg-secondary")}
          style={indent}
          onClick={navClick(target.key, target.href, p.onNavigate, p.afterNavigate)}
        >
          {content}
        </L>
      ) : (
        <span title={tip} className={cn(rowClass(p), "text-muted-foreground")} style={indent}>
          {content}
        </span>
      )}
    </li>
  );
}

/**
 * The list inside the sidebar and the drawer: sections with small headings, links, and groups that
 * open in place. Use it on its own to put the same navigation in a container of your own.
 */
export function SidebarList({ sections, current, currentHref, ...p }: ListProps) {
  const id = useId();
  const currentKey = sidebarCurrentKey(sections, current, currentHref);
  return (
    <>
      {sections.map((s) => {
        const headId = `${id}-${s.key}`;
        return (
          <div key={s.key} className={cn("border-b border-border last:border-b-0", p.rail ? "py-1" : "py-1.5")}>
            {s.heading && (
              <div className={cn("flex min-h-6 items-center gap-2", p.rail ? "sr-only" : p.roomy ? "px-3" : "px-2")}>
                <h2 id={headId} className="min-w-0 flex-1 truncate text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {s.heading}
                </h2>
                {!p.rail && s.action}
              </div>
            )}
            <ul aria-labelledby={s.heading ? headId : undefined}>
              {s.items.map((it) => (
                <Item key={it.key} item={it} depth={0} currentKey={currentKey} {...p} />
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

/** Scrolls a nav list (only the list, never the page) so the current item is in view, a third of the way down. */
function revealCurrent(nav: HTMLElement | null) {
  const el = nav?.querySelector<HTMLElement>("[aria-current]");
  if (!nav || !el) return;
  const r = el.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  if (r.top < n.top || r.bottom > n.bottom) nav.scrollTop += r.top - n.top - n.height / 3;
}

export interface SidebarProps extends SidebarNavProps {
  /** The rail: a 40px column of icons, labels as tooltips and for screen readers */
  rail?: boolean;
  /** Shows the collapse / expand button at the foot, and is called with the new state */
  onRailChange?: (rail: boolean) => void;
  /** Above the list, e.g. a Compose button. `(rail) => …` to show something in the rail too. */
  header?: SidebarSlot;
  /** Under the list, e.g. storage used. `(rail) => …` to show something in the rail too. */
  footer?: SidebarSlot;
  /** Accessible name of the <nav> */
  label?: string;
  className?: string;
}

/**
 * Inline sidebar for wide screens: sections with small uppercase headings, links with icons and
 * counts, and groups that open in place (the ones holding the current page start open). The
 * current page is bold on a gray row with a dark bar on its left edge. Navigation links are in the
 * text colour, not blue. Narrows to a rail of icons. Below md, use SidebarDrawer (AppShell does).
 * Links are plain <a> unless you pass `linkAs`; mark the current item with `current` or
 * `currentHref`.
 */
export function Sidebar({ rail = false, onRailChange, header, footer, label = "Sections", className, ...nav }: SidebarProps) {
  const top = slot(header, rail);
  const bottom = slot(footer, rail);
  const navRef = useRef<HTMLElement>(null);
  const currentKey = sidebarCurrentKey(nav.sections, nav.current, nav.currentHref);
  useEffect(() => revealCurrent(navRef.current), [currentKey, rail]);
  return (
    <div data-slot="sidebar" data-rail={rail || undefined} className={cn("flex shrink-0 flex-col border-r border-border bg-background", rail ? "w-10" : "w-52", className)}>
      {top != null && <div className={cn("border-b border-border", rail ? "flex justify-center py-1.5" : "p-2")}>{top}</div>}
      <nav ref={navRef} aria-label={label} className="min-h-0 flex-1 overflow-y-auto">
        <SidebarList {...nav} rail={rail} />
      </nav>
      {bottom != null && (
        <div className={cn("border-t border-border text-[13px] text-muted-foreground", rail ? "flex justify-center py-1.5" : "px-2 py-1.5")}>{bottom}</div>
      )}
      {onRailChange && (
        <div className={cn("ctl-sm flex border-t border-border p-1", rail && "justify-center")}>
          {rail ? (
            <IconButton variant="ghost" icon={PanelLeftOpen} label="Expand sidebar" onClick={() => onRailChange(false)} />
          ) : (
            <Button variant="ghost" icon={PanelLeftClose} aria-label="Collapse sidebar" className="w-full justify-start font-normal text-muted-foreground" onClick={() => onRailChange(true)}>
              Collapse
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export interface SidebarDrawerProps extends SidebarNavProps {
  open: boolean;
  onClose: () => void;
  /** At the top of the drawer, next to the close button: the site or app name */
  title?: ReactNode;
  /** Under the title, e.g. a Compose button */
  header?: ReactNode;
  /** At the foot */
  footer?: ReactNode;
  /** Accessible name of the drawer and its <nav> */
  label?: string;
  className?: string;
}

/**
 * The sidebar on phones: a modal <dialog> over the page from the left, with taller rows for
 * thumbs. It is driven by Dialog's useModal: the focus trap, Escape to close, the inert page
 * behind with its scrolling locked, and focus back on the button that opened it; tapping the
 * backdrop or following a link closes it too.
 */
export function SidebarDrawer({ open, onClose, title, header, footer, label = "Navigation", className, ...nav }: SidebarDrawerProps) {
  const modal = useModal({ open, onClose: () => onClose() });
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) revealCurrent(navRef.current);
  }, [open]);

  return (
    <dialog
      {...modal}
      data-slot="sidebar-drawer"
      aria-label={label}
      className={cn(
        "fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-border bg-background p-0 text-foreground shadow-md backdrop:bg-background/70",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted pr-1.5 pl-3">
          <span className="min-w-0 truncate text-[15px] font-bold">{title}</span>
          <IconButton variant="ghost" icon={X} label="Close navigation" onClick={onClose} />
        </div>
        {header != null && <div className="border-b border-border p-3">{header}</div>}
        <nav ref={navRef} aria-label={label} className="min-h-0 flex-1 overflow-y-auto">
          <SidebarList {...nav} afterNavigate={onClose} roomy />
        </nav>
        {footer != null && <div className="border-t border-border px-3 py-2 text-[13px] text-muted-foreground">{footer}</div>}
      </div>
    </dialog>
  );
}
