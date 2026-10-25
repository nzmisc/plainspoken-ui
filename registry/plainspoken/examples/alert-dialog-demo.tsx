"use client";

import { useState } from "react";
import { Trash } from "@/registry/plainspoken/lib/icons";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

export default function AlertDialogDemo() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(3);
  return (
    <div className="flex items-center gap-3">
      <Button variant="destructive" icon={Trash} disabled={count === 0} onClick={() => setOpen(true)}>
        Delete {count} {count === 1 ? "message" : "messages"}
      </Button>
      <span className="text-muted-foreground">{count} selected</span>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        destructive
        title={`Delete ${count} messages?`}
        description="They go to Trash and are deleted for good after 30 days."
        confirmLabel="Delete"
        onConfirm={() => setCount(0)}
      />
    </div>
  );
}
