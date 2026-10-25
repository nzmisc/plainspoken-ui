"use client";

import { useState } from "react";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

/**
 * For the ones that can't be undone: the button stays disabled until the name is typed. The
 * confirm returns a promise, so the dialog waits with a spinner and can't be closed meanwhile.
 */
export default function AlertDialogTypeToConfirm() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <Button variant="destructive" disabled={gone} onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <span className="text-muted-foreground">{gone ? "storefront-2026 was deleted." : "storefront-2026 · 1,284 files"}</span>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        destructive
        title="Delete storefront-2026?"
        description="Its files, deployments and environment variables are deleted at once. This can't be undone."
        confirmLabel="Delete project"
        typeToConfirm="storefront-2026"
        onConfirm={() => new Promise<void>((resolve) => setTimeout(resolve, 1200)).then(() => setGone(true))}
      />
    </div>
  );
}
