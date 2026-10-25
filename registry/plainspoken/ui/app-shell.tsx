"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Menu } from "@/registry/plainspoken/lib/icons";
import { MD_UP, useMediaQuery } from "@/registry/plainspoken/hooks/use-media-query";
import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Navbar, type NavbarLink } from "@/registry/plainspoken/ui/navbar";
import { Sidebar, SidebarDrawer, type SidebarNavProps, type SidebarSection, type SidebarSlot } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

/** How the sidebar is shown on wide screens */
export interface AppShellLayout {
  /** Not shown at all: the page gets the full width */
  hidden: boolean;
  /** Narrowed to the rail of icons */
  rail: boolean;
}

export interface AppShellProps extends SidebarNavProps {
  /** The site or app name in the bar (and at the top of the phone drawer) */
  brand?: ReactNode;
  brandHref?: string;
  /** Main links in the bar. On phones the bar hides them and the drawer lists them first. */
  links?: NavbarLink[];
  /** Right side of the bar: search, account menu. Stays in the bar on phones. */
  actions?: ReactNode;
  /** Above the sidebar's list (and in the drawer), e.g. a Compose button; `(rail) => …` for the rail too */
  sidebarHeader?: SidebarSlot;
  /** Under the sidebar's list (and in the drawer); `(rail) => …` for the rail too */
  sidebarFooter?: SidebarSlot;
  /** Accessible name of the sidebar's <nav> */
  sidebarLabel?: string;
  /** localStorage key to remember the sidebar layout under; leave out to not remember it */
  storageKey?: string;
  /** The sidebar layout before anything is remembered */
  defaultLayout?: Partial<AppShellLayout>;
  /** Start with the phone drawer open (for stories and screenshots) */
  defaultDrawerOpen?: boolean;
  /** "Skip to content" link, first in the tab order and visible when focused. On by default. */
  skipLink?: boolean;
  /** The page. Not padded: add your own, or fill it with panes. */
  children: ReactNode;
  /** The frame: h-dvh by default; give it a height of its own to sit inside a page (`h-[480px] border`) */
  className?: string;
  /** The <main> element, which scrolls on its own: padding, or `flex overflow-hidden` for panes */
  mainClassName?: string;
}

/**
 * The frame of an app: navbar across the top, sidebar on the left, and the page on the right,
 * scrolling on its own while the bar and sidebar stay put.
 *
 * The menu button left of the brand shows and hides the sidebar on wide screens, and the sidebar's
 * own button at its foot narrows it to a rail; with `storageKey` both are remembered. On phones the
 * same button opens the sidebar as a drawer, which also lists the bar's links. What shows on first
 * paint is decided by CSS breakpoints, so there is no flash while the page hydrates.
 *
 * Router-agnostic like Navbar and Sidebar: pass `linkAs` (with Next.js, `NextLink` from the
 * next-link item, which works from server and client components; next/link's own Link only from a
 * client component) and `currentHref` (the pathname), or `current` and `onNavigate` to drive it
 * from state.
 */
export function AppShell({
  brand,
  brandHref,
  links = [],
  actions,
  sections,
  current,
  currentHref,
  onNavigate,
  linkAs,
  sidebarHeader,
  sidebarFooter,
  sidebarLabel,
  storageKey,
  defaultLayout,
  defaultDrawerOpen = false,
  skipLink = true,
  children,
  className,
  mainClassName,
}: AppShellProps) {
  const desktop = useMediaQuery(MD_UP);
  const [layout, setLayout] = useStoredState<AppShellLayout>(storageKey, { hidden: false, rail: false, ...defaultLayout });
  const [drawer, setDrawer] = useState(defaultDrawerOpen);
  const main = useRef<HTMLElement>(null);
  const mainId = useId();

  // The drawer only exists on phones; widening the window closes it.
  const [wasDesktop, setWasDesktop] = useState(desktop);
  if (desktop !== wasDesktop) {
    setWasDesktop(desktop);
    if (desktop) setDrawer(false);
  }

  const nav = { current, currentHref, onNavigate, linkAs };
  const drawerSections: SidebarSection[] = [
    ...(links.length ? [{ key: "app-shell-links", items: links.map((l) => ({ key: l.key, label: l.label, href: l.href })) }] : []),
    ...sections,
  ];
  const hasNav = drawerSections.length > 0;
  const shown = desktop ? !layout.hidden : drawer;

  return (
    <div data-slot="app-shell" className={cn("relative flex h-dvh flex-col overflow-hidden bg-background text-foreground", className)}>
      {skipLink && (
        <a
          href={`#${mainId}`}
          onClick={(e) => {
            e.preventDefault();
            main.current?.focus();
          }}
          className="sr-only z-20 bg-background px-3 py-2 font-medium text-foreground underline focus:not-sr-only focus:absolute focus:top-1 focus:left-1 focus:outline-2 focus:outline-ring"
        >
          Skip to content
        </a>
      )}
      <Navbar
        links={links}
        brand={brand}
        brandHref={brandHref}
        actions={actions}
        phone="hide"
        {...nav}
        leading={
          hasNav && (
            <IconButton
              variant="ghost"
              icon={Menu}
              label={desktop ? (layout.hidden ? "Show sidebar" : "Hide sidebar") : "Open navigation"}
              aria-expanded={shown}
              onClick={() => (desktop ? setLayout((l) => ({ ...l, hidden: !l.hidden })) : setDrawer(true))}
            />
          )
        }
      />
      <div className="flex min-h-0 flex-1">
        {!layout.hidden && sections.length > 0 && (
          <Sidebar
            className="hidden md:flex"
            sections={sections}
            {...nav}
            label={sidebarLabel}
            header={sidebarHeader}
            footer={sidebarFooter}
            rail={layout.rail}
            onRailChange={(rail) => setLayout((l) => ({ ...l, rail }))}
          />
        )}
        <main id={mainId} ref={main} tabIndex={-1} className={cn("min-w-0 flex-1 overflow-y-auto focus:outline-none", mainClassName)}>
          {children}
        </main>
      </div>
      {hasNav && (
        <SidebarDrawer
          open={drawer && !desktop}
          onClose={() => setDrawer(false)}
          sections={drawerSections}
          {...nav}
          title={brand}
          label={sidebarLabel}
          header={typeof sidebarHeader === "function" ? sidebarHeader(false) : sidebarHeader}
          footer={typeof sidebarFooter === "function" ? sidebarFooter(false) : sidebarFooter}
        />
      )}
    </div>
  );
}
