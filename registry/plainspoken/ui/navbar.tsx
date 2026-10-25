"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "@/registry/plainspoken/lib/icons";
import { currentKeyFor, navClick, type LinkComponent } from "@/registry/plainspoken/lib/nav";
import { MD_UP, useMediaQuery } from "@/registry/plainspoken/hooks/use-media-query";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { cn } from "@/lib/utils";

/** A top-level link in the bar */
export interface NavbarLink {
  key: string;
  label: string;
  href: string;
}

export interface NavbarProps {
  links?: NavbarLink[];
  /** Key of the link for the current page */
  current?: string;
  /** Or the current pathname (from your router); the best-matching link is marked. `current` wins. */
  currentHref?: string;
  /** Plain left clicks on links go here instead of the browser, e.g. `(key) => setPage(key)` */
  onNavigate?: (key: string, href: string) => void;
  /** Draw links with your router's link component, e.g. next/link's `Link`. Default: a plain <a>. */
  linkAs?: LinkComponent;
  /** The site or app name, left of the links. Plain text or a logo element. */
  brand?: ReactNode;
  /** Where the brand links to; leave out for a brand that isn't a link */
  brandHref?: string;
  /** Before the brand, e.g. the app shell's sidebar toggle */
  leading?: ReactNode;
  /** Right-aligned controls: search, account, theme */
  actions?: ReactNode;
  /**
   * What happens to the links below the md breakpoint. "menu": they fold into a Menu button that
   * opens a panel under the bar (the actions go in the panel too). "hide": they go away, for when
   * something else lists them (the app shell's drawer); the actions stay in the bar.
   */
  phone?: "menu" | "hide";
  /** Accessible name of the links' <nav> */
  label?: string;
  className?: string;
}

/** The label twice, stacked, the hidden copy bold: making the current link bold doesn't change its width. */
function SteadyLabel({ children, bold }: { children: string; bold: boolean }) {
  return (
    <span className="inline-grid">
      <span className={cn("col-start-1 row-start-1", bold && "font-bold")}>{children}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1 h-0 font-bold">
        {children}
      </span>
    </span>
  );
}

/**
 * The bar across the top of a site or app: brand, main links, actions. Links are not blue: they
 * are in the text colour, underlined on hover, and the current one is bold with a bar under it
 * (aria-current="page"), the way a plain page marks "you are here".
 *
 * Router-agnostic: links are plain <a> elements unless you pass `linkAs` (next/link's Link works
 * as it is, also from a server component), and the current link comes from `current` (a key) or
 * `currentHref` (a pathname). On phones the links fold into a Menu button; Escape closes the panel
 * and puts focus back on the button.
 */
export function Navbar({
  links = [],
  current,
  currentHref,
  onNavigate,
  linkAs,
  brand,
  brandHref,
  leading,
  actions,
  phone = "menu",
  label = "Main",
  className,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const desktop = useMediaQuery(MD_UP);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const L = linkAs ?? "a";
  const currentKey = current ?? currentKeyFor(links, currentHref);
  const menu = phone === "menu" && (links.length > 0 || actions != null);

  // The panel only exists on phones; widening the window closes it.
  const [wasDesktop, setWasDesktop] = useState(desktop);
  if (desktop !== wasDesktop) {
    setWasDesktop(desktop);
    if (desktop) setOpen(false);
  }

  // Closing takes focus back to the button, which stays put, rather than leaving it on a link that goes away.
  const closeMenu = () => {
    setOpen(false);
    button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkLook = "text-foreground no-underline visited:text-foreground hover:underline underline-offset-4";
  return (
    <header data-slot="navbar" className={cn("border-b border-border bg-muted", className)}>
      <div className="flex min-h-10 items-center gap-x-4 px-2 sm:px-3">
        {leading && <div className="-mr-2 flex shrink-0 items-center">{leading}</div>}
        {brand != null &&
          (brandHref ? (
            <L href={brandHref} className={cn("min-w-0 truncate text-[15px] font-bold whitespace-nowrap text-foreground no-underline visited:text-foreground", FOCUS_RING)}>
              {brand}
            </L>
          ) : (
            <span className="min-w-0 truncate text-[15px] font-bold whitespace-nowrap">{brand}</span>
          ))}
        {links.length > 0 && (
          <nav aria-label={label} className="hidden min-w-0 self-stretch overflow-x-auto md:flex">
            <ul className="flex items-stretch gap-x-4">
              {links.map((l) => {
                const on = l.key === currentKey;
                return (
                  <li key={l.key} className="flex">
                    <L
                      href={l.href}
                      aria-current={on ? "page" : undefined}
                      onClick={navClick(l.key, l.href, onNavigate)}
                      className={cn(
                        "relative flex items-center whitespace-nowrap",
                        linkLook,
                        on && "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground hover:no-underline",
                        FOCUS_RING,
                        "focus-visible:-outline-offset-2",
                      )}
                    >
                      <SteadyLabel bold={on}>{l.label}</SteadyLabel>
                    </L>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        {actions != null && <div className={cn("ml-auto shrink-0 items-center gap-1.5", menu ? "hidden md:flex" : "flex")}>{actions}</div>}
        {menu && (
          <Button
            ref={button}
            variant="ghost"
            icon={open ? X : Menu}
            className="ml-auto shrink-0 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
          >
            Menu
          </Button>
        )}
      </div>
      {menu && open && (
        <div id={panelId} className="border-t border-border bg-background md:hidden">
          {links.length > 0 && (
            <nav aria-label={label}>
              <ul>
                {links.map((l) => {
                  const on = l.key === currentKey;
                  return (
                    <li key={l.key} className="border-b border-border last:border-b-0">
                      <L
                        href={l.href}
                        aria-current={on ? "page" : undefined}
                        onClick={(e) => navClick(l.key, l.href, onNavigate, closeMenu)(e)}
                        className={cn(
                          "relative flex min-h-10 items-center px-3",
                          linkLook,
                          on && "bg-accent font-bold before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground",
                          FOCUS_RING,
                          "focus-visible:-outline-offset-2",
                        )}
                      >
                        {l.label}
                      </L>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          {actions != null && (
            <div className={cn("flex flex-wrap items-center gap-1.5 px-3 py-2", links.length > 0 && "border-t border-border")}>{actions}</div>
          )}
        </div>
      )}
    </header>
  );
}
