"use client";

import { useState } from "react";
import { Archive, FileText, Inbox, Send, SquarePen, Trash } from "@/registry/plainspoken/lib/icons";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";

const FOLDERS: SidebarSection[] = [
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

const MESSAGES = [
  { id: 1, from: "Marta Kowalska", subject: "Proofs for the spring catalogue", time: "09:12", unread: true },
  { id: 2, from: "Harbour Print Co.", subject: "Invoice 2026-114", time: "08:47", unread: true },
  { id: 3, from: "Tomás Ruiz", subject: "Re: Friday's stand-up moved to 10:30", time: "Yesterday", unread: true },
  { id: 4, from: "Lena Fischer", subject: "Photos from the offsite", time: "Mon", unread: false },
];

/**
 * The page area isn't padded or titled, so it can hold panes: here mainClassName="flex overflow-hidden" with a
 * message list and a reading pane, each scrolling on its own. The sidebar starts as a rail.
 */
export default function AppShellPanes() {
  const [folder, setFolder] = useState("inbox");
  const [open, setOpen] = useState(1);
  const message = MESSAGES.find((m) => m.id === open)!;
  return (
    <AppShell
      className="h-[420px] border border-border"
      brand="Post"
      sections={FOLDERS}
      sidebarLabel="Folders"
      current={folder}
      onNavigate={setFolder}
      sidebarHeader={(rail) => (rail ? <IconButton variant="primary" size="sm" icon={SquarePen} label="Compose" /> : <Button variant="primary" size="sm" icon={SquarePen} block>Compose</Button>)}
      defaultLayout={{ rail: true }}
      mainClassName="flex overflow-hidden"
    >
      <ul aria-label="Messages" className="w-2/5 shrink-0 overflow-y-auto border-r border-border sm:w-72">
        {MESSAGES.map((m) => (
          <li key={m.id} className="border-b border-border">
            <button
              type="button"
              aria-current={m.id === open || undefined}
              onClick={() => setOpen(m.id)}
              className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-secondary aria-[current]:bg-accent"
            >
              <span className="flex justify-between gap-2">
                <span className={m.unread ? "font-bold" : undefined}>{m.from}</span>
                <span className="text-[12px] text-muted-foreground tabular-nums">{m.time}</span>
              </span>
              <span className="block truncate text-[13px] text-muted-foreground">{m.subject}</span>
            </button>
          </li>
        ))}
      </ul>
      <article className="min-w-0 flex-1 overflow-y-auto p-4">
        <h1 className="text-[18px] font-bold">{message.subject}</h1>
        <p className="mb-3 text-[13px] text-muted-foreground">From {message.from}</p>
        <p className="max-w-prose">Hi, the files are attached. Let me know by Thursday if anything needs changing before it goes to print.</p>
      </article>
    </AppShell>
  );
}
