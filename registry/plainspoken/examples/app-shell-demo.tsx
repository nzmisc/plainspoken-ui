"use client";

import { useState } from "react";
import { Bell, ChartBar, ChevronDown, CircleQuestionMark, Download, Funnel, LayoutDashboard, Plus, Settings, Target, Users } from "@/registry/plainspoken/lib/icons";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const LINKS = [
  { key: "overview", label: "Dashboard", href: "#overview" },
  { key: "weekly", label: "Reports", href: "#weekly" },
  { key: "team", label: "Team", href: "#team" },
];

const SECTIONS: SidebarSection[] = [
  {
    key: "site",
    heading: "acme.shop",
    items: [
      { key: "overview", label: "Overview", href: "#overview", icon: LayoutDashboard },
      { key: "traffic", label: "Traffic", href: "#traffic", icon: ChartBar },
      { key: "goals", label: "Goals", href: "#goals", icon: Target, badge: 3, badgeLabel: "3 goals met this week" },
      { key: "audiences", label: "Audiences", href: "#audiences", icon: Users },
    ],
  },
  {
    key: "reports",
    heading: "Reports",
    items: [
      { key: "weekly", label: "Weekly summary", href: "#weekly", icon: Download },
      {
        key: "funnels",
        label: "Funnels",
        icon: Funnel,
        children: [
          { key: "signup", label: "Sign-up", href: "#signup" },
          { key: "checkout", label: "Checkout", href: "#checkout" },
        ],
      },
    ],
  },
  {
    key: "account",
    items: [
      { key: "settings", label: "Settings", href: "#settings", icon: Settings },
      { key: "help", label: "Help", href: "#help", icon: CircleQuestionMark },
    ],
  },
];

const TITLES: Record<string, string> = {
  overview: "Overview",
  traffic: "Traffic",
  goals: "Goals",
  audiences: "Audiences",
  weekly: "Weekly summary",
  signup: "Sign-up funnel",
  checkout: "Checkout funnel",
  settings: "Settings",
  help: "Help",
  team: "Team",
};

/**
 * Bar, sidebar and a page that scrolls on its own, here in a 480px box (full-page it is h-dvh).
 * The menu button hides the sidebar, "Collapse" narrows it to a rail; below 768px the same button
 * opens a drawer that also lists the bar's links.
 */
export default function AppShellDemo() {
  const [page, setPage] = useState("overview");
  return (
    <AppShell
      className="h-[480px] border border-border"
      brand="Acme Analytics"
      links={LINKS}
      sections={SECTIONS}
      current={page}
      onNavigate={setPage}
      actions={
        <>
          <IconButton variant="ghost" icon={Bell} label="Notifications" />
          <Button variant="ghost" iconEnd={ChevronDown}>
            Priya
          </Button>
        </>
      }
      sidebarHeader={(rail) =>
        rail ? <IconButton variant="primary" size="sm" icon={Plus} label="New report" /> : (
          <Button variant="primary" size="sm" icon={Plus} block>
            New report
          </Button>
        )
      }
      sidebarFooter="Free plan: 8,412 of 10,000 events"
      mainClassName="p-4"
    >
      <h1 className="mb-1 text-[20px] font-bold">{TITLES[page]}</h1>
      <p className="mb-3 text-muted-foreground">acme.shop, last 7 days</p>
      <table className="text-[14px]">
        <tbody>
          {[
            ["Visitors", "18,204"],
            ["Page views", "61,930"],
            ["Bounce rate", "41%"],
            ["Orders", "512"],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-border">
              <th scope="row" className="py-1 pr-8 text-left font-normal">
                {k}
              </th>
              <td className="py-1 text-right tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 max-w-prose">
        The page scrolls inside the frame while the bar and the sidebar stay where they are. Add as much as you like here; the
        frame doesn&apos;t pad or title it for you.
      </p>
    </AppShell>
  );
}
