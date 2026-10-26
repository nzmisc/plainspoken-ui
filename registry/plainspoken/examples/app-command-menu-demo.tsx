"use client";

import { useState } from "react";
import { Search } from "@/registry/plainspoken/lib/icons";
import { AppCommandMenu } from "@/registry/plainspoken/blocks/app/command-menu";
import { Button } from "@/registry/plainspoken/ui/button";

/** Open it and type "lis" for the customers in Lisbon, or "new" for the create commands. */
export default function AppCommandMenuDemo() {
  const [open, setOpen] = useState(false);
  const [ran, setRan] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button icon={Search} onClick={() => setOpen(true)}>
        Search Tally
      </Button>
      {ran && <span className="text-muted-foreground">Would go to {ran}</span>}
      <AppCommandMenu open={open} onClose={() => setOpen(false)} onNavigate={setRan} onCreate={(what) => setRan(`a new ${what}`)} />
    </div>
  );
}
