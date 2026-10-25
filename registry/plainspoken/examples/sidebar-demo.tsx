"use client";

import { useState } from "react";
import { Archive, FileText, Inbox, OctagonX, Send, SquarePen, Star, Tag, Trash } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Sidebar, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const FOLDERS: SidebarSection[] = [
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
    items: [
      { key: "invoices", label: "Invoices", href: "#invoices", icon: Tag, badge: 4, badgeLabel: "4 unread" },
      { key: "travel", label: "Travel", href: "#travel", icon: Tag },
      { key: "family", label: "Family", href: "#family", icon: Tag, badge: 1, badgeLabel: "1 unread" },
    ],
  },
];

/** A mail client's folders: counts read out as "12 unread", a Compose button on top and the quota underneath. */
export default function SidebarDemo() {
  const [folder, setFolder] = useState("inbox");
  return (
    <div className="flex h-[400px] border border-border">
      <Sidebar
        label="Mail folders"
        sections={FOLDERS}
        current={folder}
        onNavigate={setFolder}
        header={
          <Button variant="primary" icon={SquarePen} block>
            Compose
          </Button>
        }
        footer="3.2 GB of 15 GB used"
      />
      <p className="p-3 text-muted-foreground">
        Showing <b className="text-foreground">{folder}</b>
      </p>
    </div>
  );
}
