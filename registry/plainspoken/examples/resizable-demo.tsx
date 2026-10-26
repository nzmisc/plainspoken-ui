"use client";

import { useState } from "react";
import { Archive, File, Inbox, Send, Star, Trash } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/plainspoken/ui/resizable";
import { cn } from "@/lib/utils";

const FOLDERS = [
  { name: "Inbox", icon: Inbox, count: 4 },
  { name: "Starred", icon: Star },
  { name: "Sent", icon: Send },
  { name: "Drafts", icon: File, count: 1 },
  { name: "Archive", icon: Archive },
  { name: "Trash", icon: Trash },
];

const MESSAGES = [
  { from: "Priya Raman", subject: "Q3 budget, second pass", time: "09:41", body: "I've moved the travel line into events and cut the software total by 8%. The sheet is in the shared drive; can you check the contractor rates before Thursday?" },
  { from: "Tomás Ferreira", subject: "Porto offsite: hotel options", time: "08:15", body: "Three hotels have room for 14 of us in the week of 17 November. The one by the river is the dearest but has a meeting room included." },
  { from: "Northwind Billing", subject: "Your invoice INV-20260412", time: "Yesterday", body: "Your invoice for October is ready. €1,284.00 will be charged to the card ending 4242 on 1 November." },
  { from: "Hannah Lindqvist", subject: "Re: storefront launch", time: "Yesterday", body: "Launch moved to Tuesday. Marketing wants the banner live at 10:00 CET, and support will be on the chat from 09:00." },
];

/**
 * The mail layout: folders, the message list and the open message, each resizable. Drag a line,
 * or Tab to it and use ← and →. The folder list is collapsible: drag it past half its minimum,
 * or focus its line and press Enter. The layout is remembered across reloads (autoSaveId).
 */
export default function ResizableDemo() {
  const [folder, setFolder] = useState("Inbox");
  const [open, setOpen] = useState(0);
  const m = MESSAGES[open];
  return (
    <div className="h-[26rem] border border-border">
      <ResizablePanelGroup autoSaveId="docs-mail-example">
        <ResizablePanel defaultSize={20} minSize={14} maxSize={30} collapsible className="bg-muted">
          <nav aria-label="Folders" className="py-1">
            {FOLDERS.map((f) => (
              <button
                key={f.name}
                type="button"
                aria-current={f.name === folder ? "page" : undefined}
                onClick={() => setFolder(f.name)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-1 text-left hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  f.name === folder && "font-bold",
                )}
              >
                <Icon icon={f.icon} className="text-muted-foreground" />
                <span className="flex-1 truncate">{f.name}</span>
                {f.count && <span className="text-[12px] tabular-nums text-muted-foreground">{f.count}</span>}
              </button>
            ))}
          </nav>
        </ResizablePanel>
        <ResizableHandle aria-label="Resize folders" />
        <ResizablePanel defaultSize={34} minSize={22}>
          <ul aria-label={folder}>
            {MESSAGES.map((msg, i) => (
              <li key={msg.subject} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-current={i === open || undefined}
                  className={cn(
                    "block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    i === open && "bg-accent hover:bg-accent",
                  )}
                >
                  <span className="flex justify-between gap-2">
                    <b className="truncate">{msg.from}</b>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{msg.time}</span>
                  </span>
                  <span className="block truncate">{msg.subject}</span>
                </button>
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize message list" />
        <ResizablePanel defaultSize={46} minSize={30}>
          <article className="p-4">
            <h3 className="text-[15px] font-bold">{m.subject}</h3>
            <p className="mb-3 text-[13px] text-muted-foreground">
              {m.from} · {m.time}
            </p>
            <p className="max-w-prose">{m.body}</p>
          </article>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
