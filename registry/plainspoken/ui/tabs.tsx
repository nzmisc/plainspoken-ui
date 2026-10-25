"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: ReactNode;
  /** A small count after the label: unread messages, errors */
  count?: number;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  /** The selected tab's id, when you keep it (in the URL, say). Leave out to let the tabs keep their own. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Accessible name of the tab strip: "Account settings" */
  label: string;
  /** boxed: file-folder tabs joined to a bordered panel. plain: an underlined strip over unboxed content. */
  variant?: "boxed" | "plain";
  /** Height of the tabs, from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  className?: string;
  /** Classes for every panel: padding, a minimum height */
  panelClassName?: string;
}

/**
 * Tabs per the ARIA pattern: one Tab stop for the whole strip; ←/→, Home and End move along it
 * and select as they go, then Tab goes into the panel. Disabled tabs are skipped. The strip
 * scrolls sideways when it doesn't fit, and the chosen tab's label turns bold without the strip
 * shifting (each tab is as wide as its bold label). Every panel is rendered (hidden unless
 * chosen), so find-in-page and search engines see all of them.
 */
export function Tabs({ tabs, value, defaultValue, onChange, label, variant = "boxed", size, className, panelClassName }: TabsProps) {
  const base = useId();
  const [own, setOwn] = useState(defaultValue ?? tabs.find((t) => !t.disabled)?.id);
  const current = value ?? own;
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const select = (id: string) => {
    setOwn(id);
    onChange?.(id);
    refs.current.get(id)?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === current);
    const next =
      e.key === "ArrowRight"
        ? enabled[(i + 1) % enabled.length]
        : e.key === "ArrowLeft"
          ? enabled[(i - 1 + enabled.length) % enabled.length]
          : e.key === "Home"
            ? enabled[0]
            : e.key === "End"
              ? enabled.at(-1)
              : null;
    if (next) {
      e.preventDefault();
      select(next.id);
    }
  };
  const boxed = variant === "boxed";
  return (
    <div data-slot="tabs" data-variant={variant} className={cn("min-w-0", controlSize(size), className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKey}
        className={cn(
          "flex overflow-x-auto text-(length:--ctl-text)",
          boxed ? "[&>*+*]:-ml-px" : "gap-4 border-b border-border",
        )}
      >
        {tabs.map((t) => {
          const on = t.id === current;
          return (
            <button
              key={t.id}
              ref={(el) => {
                if (el) refs.current.set(t.id, el);
                else refs.current.delete(t.id);
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              disabled={t.disabled}
              onClick={() => select(t.id)}
              className={cn(
                "relative inline-flex h-(--ctl-h) shrink-0 cursor-pointer items-center gap-(--ctl-gap) leading-none whitespace-nowrap select-none",
                "focus-visible:z-10 disabled:cursor-not-allowed disabled:text-muted-foreground",
                // Drawn inside the tab: the scrolling strip would clip an outline outside it
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                boxed
                  ? cn(
                      "border border-border px-(--ctl-px)",
                      on ? "z-[1] border-b-background bg-background" : "bg-muted text-muted-foreground enabled:hover:bg-accent enabled:hover:text-foreground",
                    )
                  : cn(
                      "-mb-px border-b-2",
                      on ? "border-b-primary" : "border-b-transparent text-muted-foreground enabled:hover:border-b-border enabled:hover:text-foreground",
                    ),
              )}
            >
              <BoldSteady bold={on}>{t.label}</BoldSteady>
              {t.count != null && <span className="font-normal text-muted-foreground tabular-nums">{t.count}</span>}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== current}
          tabIndex={0}
          className={cn(
            boxed ? "-mt-px border border-border p-3" : "pt-3",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            panelClassName,
          )}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

/** The label at its bold width always (an invisible bold copy holds the space), so selecting a tab moves nothing */
function BoldSteady({ bold, children }: { bold: boolean; children: ReactNode }) {
  return (
    <span className="inline-grid">
      <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
        {children}
      </span>
      <span className={cn("col-start-1 row-start-1 text-center", bold && "font-semibold")}>{children}</span>
    </span>
  );
}
