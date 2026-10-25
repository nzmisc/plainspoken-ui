import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  Archive,
  AtSign,
  Bell,
  ChevronDown,
  FileText,
  HardDrive,
  Inbox,
  LayoutDashboard,
  ListTree,
  Network,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  SquarePen,
  Trash,
} from "@/registry/plainspoken/lib/icons";
import { AppShell, type AppShellProps } from "@/registry/plainspoken/ui/app-shell";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const LINKS = [
  { key: "dashboard", label: "Dashboard", href: "#dashboard" },
  { key: "apps", label: "Apps", href: "#apps" },
  { key: "docs", label: "Docs", href: "#docs" },
];

const SECTIONS: SidebarSection[] = [
  {
    key: "server",
    heading: "Server",
    items: [
      { key: "overview", label: "Overview", href: "#overview", icon: LayoutDashboard },
      { key: "system", label: "CPU and memory", href: "#system", icon: Activity },
      { key: "disks", label: "Disks", href: "#disks", icon: HardDrive, badge: 3, badgeLabel: "3 disks" },
      { key: "processes", label: "Processes", href: "#processes", icon: ListTree },
    ],
  },
  {
    key: "network",
    heading: "Network",
    items: [
      {
        key: "tailscale",
        label: "Tailscale",
        icon: Network,
        children: [
          { key: "ts-serve", label: "Serve", href: "#ts-serve" },
          { key: "ts-peers", label: "Peers", href: "#ts-peers", badge: 4, badgeLabel: "4 peers online" },
        ],
      },
      { key: "addresses", label: "Addresses", href: "#addresses", icon: AtSign },
      { key: "firewall", label: "Firewall", href: "#firewall", icon: Shield },
    ],
  },
  {
    key: "system",
    items: [
      { key: "logs", label: "Logs", href: "#logs", icon: ScrollText },
      { key: "settings", label: "Settings", href: "#settings", icon: Settings },
    ],
  },
];

const TITLES: Record<string, string> = Object.fromEntries(
  [...LINKS, ...SECTIONS.flatMap((s) => s.items.flatMap((i) => [i, ...(i.children ?? [])]))].map((i) => [i.key, i.label]),
);

const actions = (
  <>
    <Input type="search" aria-label="Search" placeholder="Search" prefix={Search} className="hidden w-40 sm:inline-flex" />
    <IconButton variant="ghost" icon={Bell} label="Notifications" />
    <Button variant="ghost" iconEnd={ChevronDown}>
      ana
    </Button>
  </>
);

const DISKS = [
  { mount: "/", dev: "sda1", fs: "ext4", size: "290 GiB", free: "265 GiB", used: "8%" },
  { mount: "/boot", dev: "sda16", fs: "ext4", size: "880 MiB", free: "601 MiB", used: "27%" },
  { mount: "/boot/efi", dev: "sda15", fs: "vfat", size: "104 MiB", free: "98 MiB", used: "6%" },
];

/** Something plausible in the page, long enough to show it scrolling on its own. */
function Page({ page }: { page: string }) {
  const th = "border border-border bg-muted px-2 py-1 text-left font-semibold";
  const td = "border border-border px-2 py-1";
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <h1 className="text-[20px] font-bold">{TITLES[page] ?? page}</h1>
        <Button size="sm" icon={RefreshCw} className="ml-auto">
          Refresh
        </Button>
      </div>
      <table className="w-full max-w-2xl border-collapse text-[14px]">
        <thead>
          <tr>
            <th className={th}>Mount</th>
            <th className={th}>Device</th>
            <th className={th}>Size</th>
            <th className={th}>Free</th>
            <th className={th}>Used</th>
          </tr>
        </thead>
        <tbody>
          {DISKS.map((d) => (
            <tr key={d.mount}>
              <td className={td}>
                <code>{d.mount}</code>
              </td>
              <td className={td}>{d.dev}</td>
              <td className={`${td} text-right tabular-nums`}>{d.size}</td>
              <td className={`${td} text-right tabular-nums`}>{d.free}</td>
              <td className={`${td} text-right tabular-nums`}>{d.used}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {Array.from({ length: 30 }, (_, i) => (
        <p key={i}>
          Line {i + 1}: <code>127.0.0.1:{8000 + i}</code> serves on the tailnet.
        </p>
      ))}
    </div>
  );
}

/** AppShell wired to the data above, with navigation that changes the page. */
function ShellDemo({ start = "disks", ...props }: Partial<AppShellProps> & { start?: string }) {
  const [current, setCurrent] = useState(start);
  return (
    <AppShell brand="atlas" links={LINKS} sections={SECTIONS} current={current} onNavigate={setCurrent} actions={actions} sidebarFooter="up 12 days" {...props}>
      <Page page={current} />
    </AppShell>
  );
}

// Full-height frames: on the docs page each story gets an iframe of its own, 560px tall, so h-dvh is that.
const meta: Meta<typeof AppShell> = {
  title: "Components/Layout/App shell",
  component: AppShell,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "560px" } } },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

/**
 * Navbar, sidebar and a page that scrolls on its own. The menu button hides the sidebar,
 * "Collapse" narrows it; both are remembered in localStorage (key "stories.app-shell"), so reload
 * to check. Tab from the top: "Skip to content" comes first.
 */
export const Default: Story = { render: () => <ShellDemo storageKey="stories.app-shell" /> };

/** Sidebar narrowed to the rail: icons, with labels as tooltips. The footer slot only shows when expanded. */
export const Rail: Story = { render: () => <ShellDemo defaultLayout={{ rail: true }} /> };

/** Sidebar hidden: the page gets the full width; the menu button brings it back. */
export const SidebarHidden: Story = { render: () => <ShellDemo defaultLayout={{ hidden: true }} start="overview" /> };

/** Phone: the bar and the page. The menu button opens the drawer, which also lists the bar's links. */
export const Phone: Story = {
  render: () => <ShellDemo />,
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};

/** Phone with the drawer open. Left off the docs page, where the modal would take the focus. */
export const PhoneDrawerOpen: Story = {
  tags: ["!autodocs"],
  render: () => <ShellDemo defaultDrawerOpen start="ts-peers" />,
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};

const MAIL: SidebarSection[] = [
  {
    key: "folders",
    items: [
      { key: "inbox", label: "Inbox", href: "#inbox", icon: Inbox, badge: 3, badgeLabel: "3 unread" },
      { key: "drafts", label: "Drafts", href: "#drafts", icon: FileText, badge: 1, badgeLabel: "1 draft" },
      { key: "sent", label: "Sent", href: "#sent", icon: Send },
      { key: "archive", label: "Archive", href: "#archive", icon: Archive },
      { key: "trash", label: "Trash", href: "#trash", icon: Trash },
    ],
  },
];

/** The page isn't padded or titled: with `mainClassName="flex overflow-hidden"` it holds panes that scroll on their own. */
export const Panes: Story = {
  render: function Render() {
    const [folder, setFolder] = useState("inbox");
    return (
      <AppShell
        brand="Post"
        sections={MAIL}
        sidebarLabel="Folders"
        current={folder}
        onNavigate={setFolder}
        sidebarHeader={(rail) =>
          rail ? (
            <IconButton variant="primary" size="sm" icon={SquarePen} label="Compose" />
          ) : (
            <Button variant="primary" size="sm" icon={SquarePen} block>
              Compose
            </Button>
          )
        }
        mainClassName="flex overflow-hidden"
      >
        <ul aria-label="Messages" className="w-2/5 shrink-0 overflow-y-auto border-r border-border sm:w-80">
          {Array.from({ length: 40 }, (_, i) => (
            <li key={i} className="border-b border-border px-3 py-1.5">
              <b>Harbour Print Co.</b>
              <span className="block truncate text-[13px] text-muted-foreground">Invoice 2026-{114 - i}: due in {i + 3} days</span>
            </li>
          ))}
        </ul>
        <article className="min-w-0 flex-1 overflow-y-auto p-4">
          <h1 className="text-[18px] font-bold">Invoice 2026-114</h1>
          <p className="text-muted-foreground">Folder: {folder}</p>
        </article>
      </AppShell>
    );
  },
};

/**
 * With next/link: `linkAs={Link}` and the pathname as `currentHref` (from usePathname() in a real
 * app). "/servers/atlas/disks" marks Disks, the longest matching link.
 */
export const WithNextLink: Story = {
  render: () => (
    <AppShell
      brand="atlas"
      brandHref="/"
      linkAs={Link}
      currentHref="/servers/atlas/disks"
      links={[
        { key: "dashboard", label: "Dashboard", href: "/" },
        { key: "servers", label: "Servers", href: "/servers" },
      ]}
      sections={[
        {
          key: "atlas",
          heading: "atlas",
          items: [
            { key: "overview", label: "Overview", href: "/servers/atlas", icon: LayoutDashboard },
            { key: "disks", label: "Disks", href: "/servers/atlas/disks", icon: HardDrive },
            { key: "logs", label: "Logs", href: "/servers/atlas/logs", icon: ScrollText },
          ],
        },
      ]}
    >
      <Page page="disks" />
    </AppShell>
  ),
};
