"use client";

import { useState } from "react";
import { Activity, HardDrive, LayoutDashboard, ListTree, Network, ScrollText, Settings, Shield } from "@/registry/plainspoken/lib/icons";
import { Sidebar, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const SECTIONS: SidebarSection[] = [
  {
    key: "server",
    heading: "Server",
    items: [
      { key: "overview", label: "Overview", href: "#overview", icon: LayoutDashboard },
      { key: "system", label: "CPU and memory", href: "#system", icon: Activity },
      { key: "disks", label: "Disks", href: "#disks", icon: HardDrive, badge: "!", badgeLabel: "1 disk almost full" },
      { key: "processes", label: "Processes", href: "#processes", icon: ListTree, badge: 214 },
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
          { key: "serve", label: "Serve", href: "#serve" },
          { key: "peers", label: "Peers", href: "#peers", badge: 4 },
          { key: "acl", label: "Access rules", href: "#acl" },
        ],
      },
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

/**
 * Groups open in place, and the one holding the current page starts open. "Collapse" narrows the
 * sidebar to a rail of icons: labels become tooltips (and stay for screen readers), a group
 * becomes one link to its first page, and a count becomes a dot.
 */
export default function SidebarRail() {
  const [page, setPage] = useState("peers");
  const [rail, setRail] = useState(false);
  return (
    <div className="flex h-[440px] border border-border">
      <Sidebar label="Server admin" sections={SECTIONS} current={page} onNavigate={setPage} rail={rail} onRailChange={setRail} />
      <p className="p-3 text-muted-foreground">
        Showing <b className="text-foreground">{page}</b>
      </p>
    </div>
  );
}
