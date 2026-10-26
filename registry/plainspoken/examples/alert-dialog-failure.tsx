"use client";

import { useState } from "react";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

/** When the confirm fails, the dialog stays open and says why, so it can be tried again or cancelled. */
export default function AlertDialogFailure() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Cancel subscription</Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cancel the Team plan?"
        description="You keep the paid features until 31 October, then the workspace moves to the free plan."
        cancelLabel="Keep plan"
        confirmLabel="Cancel subscription"
        onConfirm={() =>
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error("The payment provider didn't answer. Nothing was changed; try again in a minute.")), 900))
        }
      >
        <p className="text-muted-foreground">Projects over the free limit of 3 become read-only.</p>
      </AlertDialog>
    </>
  );
}
