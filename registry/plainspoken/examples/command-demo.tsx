"use client";

import { useState } from "react";
import { Calendar, FilePlus, Inbox, Keyboard, Languages, MailPlus, Moon, Search, Settings, Upload, Users } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { CommandDialog, useCommandShortcut, useModifierKey, type CommandGroup } from "@/registry/plainspoken/ui/command";
import { Kbd } from "@/registry/plainspoken/ui/kbd";

export default function CommandDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const mod = useModifierKey();
  useCommandShortcut(() => setOpen((o) => !o));
  const did = (what: string) => () => setLast(what);
  const groups: CommandGroup[] = [
    {
      heading: "Create",
      items: [
        { label: "New message", icon: MailPlus, shortcut: [mod, "N"], onSelect: did("New message") },
        { label: "New event", icon: Calendar, keywords: ["meeting", "appointment"], onSelect: did("New event") },
        { label: "New document", icon: FilePlus, onSelect: did("New document") },
        { label: "Upload files", icon: Upload, hint: "up to 2 GB", onSelect: did("Upload files") },
      ],
    },
    {
      heading: "Go to",
      items: [
        { label: "Inbox", icon: Inbox, shortcut: ["G", "I"], onSelect: did("Inbox") },
        { label: "Calendar", icon: Calendar, shortcut: ["G", "C"], onSelect: did("Calendar") },
        { label: "Contacts", icon: Users, keywords: ["people", "address book"], onSelect: did("Contacts") },
        { label: "Settings", icon: Settings, keywords: ["preferences", "options"], shortcut: [mod, ","], onSelect: did("Settings") },
      ],
    },
    {
      heading: "Preferences",
      items: [
        { label: "Switch to dark theme", icon: Moon, keywords: ["appearance", "night"], onSelect: did("Dark theme") },
        { label: "Change language", icon: Languages, hint: "English (UK)", onSelect: did("Change language") },
        { label: "Keyboard shortcuts", icon: Keyboard, shortcut: ["?"], onSelect: did("Keyboard shortcuts") },
      ],
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={Search} onClick={() => setOpen(true)} className="font-normal text-muted-foreground">
        Search commands <Kbd keys={[mod, "K"]} className="ml-3 text-[12px]" />
      </Button>
      <span className="text-muted-foreground">{last ? `Ran: ${last}` : `Or press ${mod}+K anywhere on the page.`}</span>
      <CommandDialog open={open} onClose={() => setOpen(false)} groups={groups} />
    </div>
  );
}
