"use client";

import { useState } from "react";
import { Copy, Download, Link, Pencil, Share2, Trash } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "Share", icon: Share2 },
  { label: "Copy link", icon: Link },
  { label: "Make a copy", icon: Copy },
  { label: "Rename", icon: Pencil },
  { label: "Download", icon: Download },
];

/** A sheet of actions from the bottom, the phone-friendly menu. Rows are 44px for thumbs, and the last one clears the home bar. */
export default function DrawerBottomSheet() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const row = "flex min-h-11 w-full cursor-pointer items-center gap-3 border-b border-border px-3 text-left hover:bg-secondary active:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
  const choose = (a: string) => {
    setLast(a);
    setOpen(false);
  };
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => setOpen(true)}>Q3 budget.xlsx</Button>
      {last && <span className="text-muted-foreground">Chose: {last}</span>}
      <Drawer side="bottom" open={open} onClose={() => setOpen(false)} title="Q3 budget.xlsx" description="Edited by Priya Raman, yesterday" bodyClassName="p-0">
        <div className="pb-[env(safe-area-inset-bottom)]">
          {ACTIONS.map((a) => (
            <button key={a.label} type="button" className={row} onClick={() => choose(a.label)}>
              <Icon icon={a.icon} className="text-muted-foreground" />
              {a.label}
            </button>
          ))}
          <button type="button" className={cn(row, "border-b-0 text-destructive")} onClick={() => choose("Move to Trash")}>
            <Icon icon={Trash} />
            Move to Trash
          </button>
        </div>
      </Drawer>
    </div>
  );
}
