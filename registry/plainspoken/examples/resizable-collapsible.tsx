"use client";

import { useRef, useState } from "react";
import { BookOpen, ChartBar, House, PanelLeftClose, PanelLeftOpen, Settings, Users } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizablePanelHandle } from "@/registry/plainspoken/ui/resizable";

const NAV = [
  { label: "Home", icon: House },
  { label: "Reports", icon: ChartBar },
  { label: "Customers", icon: Users },
  { label: "Guides", icon: BookOpen },
  { label: "Settings", icon: Settings },
];

/**
 * A sidebar that collapses to a rail of icons (collapsedSize) rather than to nothing, from a
 * button through panelRef, from Enter on its line, or by dragging it narrow. The panel's
 * data-collapsed attribute hides the labels.
 */
export default function ResizableCollapsible() {
  const sidebar = useRef<ResizablePanelHandle>(null);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-72 flex-col border border-border">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1">
        <Button
          size="sm"
          variant="ghost"
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          aria-expanded={!collapsed}
          onClick={() => (collapsed ? sidebar.current?.expand() : sidebar.current?.collapse())}
        >
          {collapsed ? "Show labels" : "Icons only"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup>
          <ResizablePanel
            panelRef={sidebar}
            defaultSize={26}
            minSize={18}
            maxSize={40}
            collapsible
            collapsedSize={7}
            onCollapsedChange={setCollapsed}
            className="group/side bg-muted"
          >
            <nav aria-label="Main" className="py-1">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={`#${n.label.toLowerCase()}`}
                  title={n.label}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground no-underline visited:text-foreground hover:bg-accent group-data-collapsed/side:justify-center group-data-collapsed/side:px-0"
                >
                  <Icon icon={n.icon} />
                  <span className="truncate group-data-collapsed/side:sr-only">{n.label}</span>
                </a>
              ))}
            </nav>
          </ResizablePanel>
          <ResizableHandle aria-label="Resize sidebar" />
          <ResizablePanel defaultSize={74}>
            <div className="p-4">
              <h3 className="font-bold">Reports</h3>
              <p className="text-muted-foreground">Revenue this month: €48,210, up 12% on September.</p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
