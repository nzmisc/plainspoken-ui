"use client";

import { FilePlus, FolderKanban, LayoutDashboard, Receipt, Settings, UserPlus, Users, BookOpen, Building } from "@/registry/plainspoken/lib/icons";
import { CUSTOMERS } from "@/registry/plainspoken/blocks/app/data";
import { CommandDialog, type CommandGroup } from "@/registry/plainspoken/ui/command";

/** The app's pages, for the palette and the sidebar */
export const APP_PAGES = [
  { href: "/demos/app", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { href: "/demos/app/customers", label: "Customers", icon: Users, keywords: ["clients", "companies"] },
  { href: "/demos/app/projects", label: "Projects", icon: FolderKanban, keywords: ["board", "jobs"] },
  { href: "/demos/app/invoices", label: "Invoices", icon: Receipt, keywords: ["bills", "payments"] },
  { href: "/demos/app/settings", label: "Settings", icon: Settings, keywords: ["profile", "team", "billing", "preferences"] },
];

export interface AppCommandMenuProps {
  open: boolean;
  onClose: () => void;
  /** Go to a page: router.push, or set state */
  onNavigate: (href: string) => void;
  /** "New invoice", "New customer" */
  onCreate?: (what: "invoice" | "customer") => void;
}

/**
 * The ⌘K palette of the app: go to a page or straight to a customer (search them by name,
 * contact or city), and create an invoice or a customer. Built on CommandDialog: type to filter,
 * ↑/↓ and Enter to run, Escape to close.
 */
export function AppCommandMenu({ open, onClose, onNavigate, onCreate }: AppCommandMenuProps) {
  const groups: CommandGroup[] = [
    {
      heading: "Go to",
      items: APP_PAGES.map((p) => ({ id: p.href, label: p.label, icon: p.icon, keywords: p.keywords, onSelect: () => onNavigate(p.href) })),
    },
    {
      heading: "Create",
      items: [
        { label: "New invoice", icon: FilePlus, keywords: ["bill"], shortcut: ["N"], onSelect: () => onCreate?.("invoice") },
        { label: "New customer", icon: UserPlus, keywords: ["client", "add"], onSelect: () => onCreate?.("customer") },
      ],
    },
    {
      heading: "Customers",
      items: CUSTOMERS.filter((c) => c.status !== "Archived").map((c) => ({
        id: `customer-${c.id}`,
        label: c.name,
        hint: `${c.contact}, ${c.city}`,
        icon: Building,
        keywords: [c.contact, c.city, c.country],
        onSelect: () => onNavigate(`/demos/app/customers/${c.id}`),
      })),
    },
    {
      heading: "Help",
      items: [{ label: "plainspoken-ui documentation", icon: BookOpen, keywords: ["docs", "help"], onSelect: () => onNavigate("/docs") }],
    },
  ];
  return <CommandDialog open={open} onClose={onClose} groups={groups} label="Search Tally" placeholder="Go to a page or customer, or create something…" />;
}
