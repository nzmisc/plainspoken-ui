"use client";

import { useState } from "react";
import { BookOpen, House, LibraryBig, ListMusic, Menu, Mic, Plus, Radio } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { SidebarDrawer, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const SECTIONS: SidebarSection[] = [
  {
    key: "main",
    items: [
      { key: "home", label: "Home", href: "#home", icon: House },
      { key: "radio", label: "Radio", href: "#radio", icon: Radio },
      { key: "library", label: "Your library", href: "#library", icon: LibraryBig },
    ],
  },
  {
    key: "playlists",
    heading: "Playlists",
    action: <IconButton size="xs" variant="ghost" icon={Plus} label="New playlist" />,
    items: [
      { key: "focus", label: "Deep focus", href: "#focus", icon: ListMusic },
      { key: "sunday", label: "Sunday morning", href: "#sunday", icon: ListMusic, badge: "new", badgeLabel: "new songs" },
      { key: "running", label: "Running, 170 bpm", href: "#running", icon: ListMusic },
    ],
  },
  {
    key: "more",
    heading: "More",
    items: [
      { key: "podcasts", label: "Podcasts", href: "#podcasts", icon: Mic },
      { key: "audiobooks", label: "Audiobooks", href: "#audiobooks", icon: BookOpen },
    ],
  },
];

/**
 * On phones the sidebar is a drawer: a modal dialog from the left with taller rows. Escape, the
 * close button, the backdrop or following a link closes it, and focus goes back to the button.
 */
export default function SidebarDrawerExample() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("sunday");
  return (
    <div className="flex items-center gap-3">
      <Button icon={Menu} aria-expanded={open} onClick={() => setOpen(true)}>
        Open navigation
      </Button>
      <span className="text-muted-foreground">
        Showing <b className="text-foreground">{page}</b>
      </span>
      <SidebarDrawer open={open} onClose={() => setOpen(false)} title="Tuneful" label="Library" sections={SECTIONS} current={page} onNavigate={setPage} />
    </div>
  );
}
