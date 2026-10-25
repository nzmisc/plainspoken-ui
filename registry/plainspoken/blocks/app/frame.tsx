"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Search } from "@/registry/plainspoken/lib/icons";
import { CUSTOMERS, INVOICES, PRODUCT, PROJECTS, WORKSPACE } from "@/registry/plainspoken/blocks/app/data";
import { APP_PAGES, AppCommandMenu } from "@/registry/plainspoken/blocks/app/command-menu";
import { AppNewCustomerDialog } from "@/registry/plainspoken/blocks/app/new-customer";
import { AppNewInvoiceDialog } from "@/registry/plainspoken/blocks/app/new-invoice";
import { AppNotifications } from "@/registry/plainspoken/blocks/app/notifications";
import { AppUserMenu } from "@/registry/plainspoken/blocks/app/user-menu";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { IconButton, buttonVariants } from "@/registry/plainspoken/ui/button";
import { useCommandShortcut, useModifierKey } from "@/registry/plainspoken/ui/command";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Meter } from "@/registry/plainspoken/ui/progress";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

const page = (href: string) => APP_PAGES.find((p) => p.href === href)!;
const item = (href: string, extra: { badge?: number; badgeLabel?: string } = {}) => {
  const p = page(href);
  return { key: href, label: p.label, href, icon: p.icon, ...extra };
};

const overdue = INVOICES.filter((i) => i.status === "Overdue").length;
const active = PROJECTS.filter((p) => p.stage !== "Done").length;

/** The sidebar of the app: its pages with counts */
export const APP_SECTIONS: SidebarSection[] = [
  {
    key: "work",
    items: [
      item("/demos/app"),
      item("/demos/app/customers", { badge: CUSTOMERS.length, badgeLabel: `${CUSTOMERS.length} customers` }),
      item("/demos/app/projects", { badge: active, badgeLabel: `${active} active projects` }),
      item("/demos/app/invoices", { badge: overdue, badgeLabel: `${overdue} overdue` }),
    ],
  },
  { key: "workspace", heading: "Workspace", items: [item("/demos/app/settings")] },
];

function WorkspaceSwitcher({ rail }: { rail: boolean }) {
  return (
    <DropdownMenu
      items={[
        {
          type: "radio",
          label: "Workspaces",
          value: "brightwater",
          onValueChange: () => {},
          options: [
            { value: "brightwater", label: WORKSPACE },
            { value: "print", label: "Brightwater Print Lda" },
          ],
        },
        { type: "separator" },
        { label: "Create a workspace", icon: Plus },
      ]}
      className="min-w-56"
      trigger={(props) =>
        rail ? (
          <button {...props} aria-label={`Workspace: ${WORKSPACE}`} className="flex cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
            <Avatar name={WORKSPACE} size={24} />
          </button>
        ) : (
          <button {...props} className={buttonVariants({ variant: "ghost", className: "w-full justify-between px-1 font-semibold" })}>
            <span className="flex min-w-0 items-center gap-2">
              <Avatar name={WORKSPACE} size={20} />
              <span className="truncate">{WORKSPACE}</span>
            </span>
            <Icon icon={ChevronsUpDown} className="text-muted-foreground" />
          </button>
        )
      }
    />
  );
}

export interface AppFrameProps {
  children: ReactNode;
  /** More controls in the top bar, before the account menu: the theme switch */
  actions?: ReactNode;
  /** The frame's height: the whole window by default */
  className?: string;
}

/**
 * The frame of the app: Tally's top bar (search that opens the ⌘K palette, notifications, the
 * account menu), and a sidebar of pages with counts, a workspace switcher at the top and the plan
 * at the foot. The sidebar hides, narrows to a rail, or becomes a drawer on phones (AppShell does
 * that), and the current page is marked from the URL. Uses next/link and next/navigation.
 */
export function AppFrame({ children, actions, className }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mod = useModifierKey();
  const [palette, setPalette] = useState(false);
  const [creating, setCreating] = useState<"invoice" | "customer" | null>(null);
  useCommandShortcut(() => setPalette((o) => !o));

  return (
    <>
      <AppShell
        brand={PRODUCT}
        brandHref="/demos/app"
        sections={APP_SECTIONS}
        currentHref={pathname}
        linkAs={Link}
        sidebarLabel="Tally"
        sidebarHeader={(rail) => <WorkspaceSwitcher rail={rail} />}
        sidebarFooter={
          <div className="flex flex-col gap-0.5">
            <span>Studio plan · 5 of 8 seats</span>
            <Meter value={5} max={8} label="Seats used" valueText="5/8" />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setPalette(true)}
              className={buttonVariants({ variant: "outline", className: "w-60 justify-between font-normal text-muted-foreground max-md:hidden" })}
            >
              <span className="flex items-center gap-(--ctl-gap)">
                <Icon icon={Search} />
                Search…
              </span>
              <Kbd keys={[mod, "K"]} className="text-[11px]" />
            </button>
            <IconButton variant="ghost" icon={Search} label="Search" onClick={() => setPalette(true)} className="md:hidden" />
            <AppNotifications />
            {actions}
            <AppUserMenu />
          </>
        }
        className={cn("h-dvh", className)}
      >
        {children}
      </AppShell>
      <AppCommandMenu open={palette} onClose={() => setPalette(false)} onNavigate={(href) => router.push(href)} onCreate={setCreating} />
      <AppNewInvoiceDialog open={creating === "invoice"} onClose={() => setCreating(null)} />
      <AppNewCustomerDialog open={creating === "customer"} onClose={() => setCreating(null)} />
    </>
  );
}
