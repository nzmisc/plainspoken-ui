"use client";

import { useState } from "react";
import { FileCode } from "@/registry/plainspoken/lib/icons";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdExportDialog } from "@/registry/plainspoken/blocks/erd/sql-dialogs";
import { Button } from "@/registry/plainspoken/ui/button";

/** The demo shop as Postgres DDL: schemas, tables with their keys and defaults, comments, indexes, and the foreign keys last. Copy it or download it. */
export default function ErdSqlDialogsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon={FileCode} onClick={() => setOpen(true)}>
        Export SQL
      </Button>
      <ErdExportDialog open={open} onClose={() => setOpen(false)} model={SHOP_MODEL} />
    </>
  );
}
