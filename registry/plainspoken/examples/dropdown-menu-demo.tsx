"use client";

import { useState } from "react";
import { Archive, Copy, Forward, MailOpen, Pin, Reply, ReplyAll, Tag, Trash } from "@/registry/plainspoken/lib/icons";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";

export default function DropdownMenuDemo() {
  const [last, setLast] = useState("nothing yet");
  const did = (what: string) => () => setLast(what);
  const items: MenuItem[] = [
    { label: "Reply", icon: Reply, shortcut: "R", onSelect: did("Reply") },
    { label: "Reply all", icon: ReplyAll, shortcut: "⇧R", onSelect: did("Reply all") },
    { label: "Forward", icon: Forward, shortcut: "F", onSelect: did("Forward") },
    { type: "separator" },
    { label: "Mark as unread", icon: MailOpen, shortcut: "⇧U", onSelect: did("Mark as unread") },
    { label: "Pin to top", icon: Pin, onSelect: did("Pin to top") },
    {
      type: "submenu",
      label: "Label as",
      icon: Tag,
      items: ["Clients", "Invoices", "Travel", "Newsletters"].map((l) => ({ label: l, onSelect: did(`Label as ${l}`) })),
    },
    { label: "Copy link to message", icon: Copy, onSelect: did("Copy link") },
    { label: "Move to folder…", icon: Archive, disabled: true, hint: "No folders yet" },
    { type: "separator" },
    { label: "Delete", icon: Trash, shortcut: "#", destructive: true, onSelect: did("Delete") },
  ];
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu trigger="Actions" chevron items={items} />
      <span className="text-muted-foreground">Last: {last}</span>
    </div>
  );
}
