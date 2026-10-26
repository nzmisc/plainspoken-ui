"use client";

import { useState } from "react";
import { Upload } from "@/registry/plainspoken/lib/icons";
import { ErdImportDialog, type ErdImport } from "@/registry/plainspoken/blocks/erd/sql-dialogs";
import { Button } from "@/registry/plainspoken/ui/button";

/**
 * Paste CREATE TABLE statements and see at once what was found, or every problem with its line;
 * a click on a line number selects that line. "Paste an example" fills in a small library schema.
 */
export default function ErdSqlDialogsImport() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ErdImport | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button icon={Upload} onClick={() => setOpen(true)}>
        Import SQL
      </Button>
      {result && (
        <p className="text-[13px]">
          Imported {result.model.tables.map((t) => t.name).join(", ")} with {result.model.relations.length} foreign keys.
        </p>
      )}
      <ErdImportDialog open={open} onClose={() => setOpen(false)} onImport={setResult} />
    </div>
  );
}
