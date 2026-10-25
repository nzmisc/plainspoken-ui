import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  Activity,
  Archive,
  AtSign,
  Bot,
  Code,
  FileText,
  Gauge,
  HardDrive,
  Inbox,
  LayoutDashboard,
  ListTree,
  Menu,
  MousePointer2,
  Network,
  OctagonX,
  Pi,
  Plus,
  ScrollText,
  Send,
  Settings,
  Shield,
  Sparkles,
  SquarePen,
  Star,
  Tag,
  Trash,
  Wallet,
} from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Sidebar, SidebarDrawer, type SidebarProps, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";

/** What a server's admin navigation might look like: badges, a nested group, a section without a heading. */
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
          { key: "ts-acl", label: "ACL", href: "#ts-acl" },
        ],
      },
      { key: "addresses", label: "Addresses", href: "#addresses", icon: AtSign },
      { key: "firewall", label: "Firewall", href: "#firewall", icon: Shield },
    ],
  },
  {
    key: "agents",
    heading: "Agents",
    items: [
      { key: "claude", label: "Claude Code", href: "#claude", icon: Sparkles, badge: "87%", badgeLabel: "87% of the weekly allowance left" },
      { key: "cursor", label: "Cursor", href: "#cursor", icon: MousePointer2, badge: "97%", badgeLabel: "97% left" },
      { key: "opencode", label: "OpenCode", href: "#opencode", icon: Code },
      { key: "pi", label: "Pi", href: "#pi", icon: Pi },
      {
        key: "t3",
        label: "T3 Code",
        icon: Bot,
        children: [
          { key: "t3-threads", label: "Threads", href: "#t3-threads" },
          {
            key: "t3-browser",
            label: "Browser",
            children: [
              { key: "t3-tabs", label: "Tabs", href: "#t3-tabs" },
              { key: "t3-sandbox", label: "Sandbox", href: "#t3-sandbox", badge: "!", badgeLabel: "needs attention" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "usage",
    heading: "Usage",
    items: [
      { key: "subs", label: "Subscriptions", href: "#subs", icon: Gauge },
      { key: "openrouter", label: "OpenRouter", href: "#openrouter", icon: Wallet, badge: "$15.15", badgeLabel: "$15.15 credit left" },
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

const MAIL: SidebarSection[] = [
  {
    key: "folders",
    items: [
      { key: "inbox", label: "Inbox", href: "#inbox", icon: Inbox, badge: 12, badgeLabel: "12 unread" },
      { key: "starred", label: "Starred", href: "#starred", icon: Star },
      { key: "drafts", label: "Drafts", href: "#drafts", icon: FileText, badge: 2, badgeLabel: "2 drafts" },
      { key: "sent", label: "Sent", href: "#sent", icon: Send },
      { key: "archive", label: "Archive", href: "#archive", icon: Archive },
      { key: "spam", label: "Spam", href: "#spam", icon: OctagonX, badge: 3, badgeLabel: "3 unread" },
      { key: "trash", label: "Trash", href: "#trash", icon: Trash },
    ],
  },
  {
    key: "labels",
    heading: "Labels",
    action: <IconButton size="xs" variant="ghost" icon={Plus} label="New label" />,
    items: [
      { key: "invoices", label: "Invoices", href: "#invoices", icon: Tag, badge: 4, badgeLabel: "4 unread" },
      { key: "travel", label: "Travel", href: "#travel", icon: Tag },
      { key: "family", label: "Family", href: "#family", icon: Tag, badge: 1, badgeLabel: "1 unread" },
    ],
  },
];

function Live({ start = "disks", rail: rail0 = false, ...props }: Partial<SidebarProps> & { start?: string }) {
  const [current, setCurrent] = useState(start);
  const [rail, setRail] = useState(rail0);
  return (
    <div className="flex h-[560px] border border-border">
      <Sidebar sections={SECTIONS} current={current} onNavigate={setCurrent} rail={rail} onRailChange={setRail} {...props} />
      <div className="p-3 text-muted-foreground">
        current: <code>{current}</code>
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Navigation/Sidebar",
  component: Sidebar,
  args: { sections: SECTIONS, current: "disks", rail: false },
  argTypes: { header: { control: false }, footer: { control: false }, linkAs: { control: false } },
} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** For the stories driven by args: the sidebar in a box of its own height */
const boxed: Pick<Story, "decorators"> = {
  decorators: [
    (S) => (
      <div className="flex h-[480px] border border-border">
        <S />
      </div>
    ),
  ],
};

/** Every simple prop in the Controls panel. */
export const Playground: Story = { ...boxed };

/**
 * Headed sections, icons, counts, a nested group. Click around; Tab moves through the rows, Enter
 * or Space opens a group. "Collapse" narrows it to the rail.
 */
export const Expanded: Story = { render: () => <Live /> };

/** The current page sits two groups deep, so the groups holding it start open. Close one and it shows bold: the current page is inside. */
export const NestedCurrent: Story = { render: () => <Live start="t3-sandbox" /> };

/** The 40px rail: icons only, labels as tooltips and for screen readers. A group becomes one link to its first page; a count becomes a dot. */
export const Rail: Story = { render: () => <Live rail /> };

/** Without icons, badges or the collapse button: just the list. */
export const Plain: Story = {
  ...boxed,
  args: {
    current: "ts-serve",
    sections: SECTIONS.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it, icon: undefined, badge: undefined })) })),
  },
};

/** A mail client: counts read as "12 unread", an action beside a heading, a header slot and a footer. In the rail the header turns into an icon button. */
export const MailFolders: Story = {
  render: function Render() {
    const [current, setCurrent] = useState("inbox");
    const [rail, setRail] = useState(false);
    return (
      <div className="flex h-[480px] border border-border">
        <Sidebar
          label="Folders"
          sections={MAIL}
          current={current}
          onNavigate={setCurrent}
          rail={rail}
          onRailChange={setRail}
          header={(r) =>
            r ? (
              <IconButton variant="primary" size="sm" icon={SquarePen} label="Compose" />
            ) : (
              <Button variant="primary" size="sm" icon={SquarePen} block>
                Compose
              </Button>
            )
          }
          footer="3.2 GB of 15 GB used"
        />
      </div>
    );
  },
};

/** Long labels are cut with an ellipsis (the full text is the link's name); counts never wrap under them. */
export const LongLabels: Story = {
  ...boxed,
  args: {
    current: "q3",
    sections: [
      {
        key: "reports",
        heading: "Shared reports with a long section heading",
        items: [
          { key: "q3", label: "Quarterly revenue by region and sales channel", href: "#q3", icon: FileText, badge: 128 },
          { key: "churn", label: "Churn cohorts, monthly, excluding trials", href: "#churn", icon: FileText, badge: "new" },
        ],
      },
    ],
  },
};

function DrawerDemo({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [current, setCurrent] = useState("disks");
  return (
    <div className="flex flex-col items-start gap-2">
      <Button icon={Menu} aria-expanded={open} onClick={() => setOpen(true)}>
        Open navigation
      </Button>
      <p className="text-muted-foreground">
        current: <code>{current}</code>
      </p>
      <SidebarDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="atlas"
        sections={SECTIONS}
        current={current}
        onNavigate={setCurrent}
        footer="atlas.tail1234.ts.net"
      />
    </div>
  );
}

/**
 * Phones: the same list in a modal drawer, with taller rows for thumbs. Escape, the close button,
 * the backdrop or following a link closes it; focus returns to the button.
 */
export const Drawer: Story = {
  render: () => <DrawerDemo startOpen={false} />,
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};

/** Starts open. Left off the docs page, where a modal would cover everything. */
export const DrawerOpen: Story = {
  tags: ["!autodocs"],
  render: () => <DrawerDemo startOpen />,
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};
