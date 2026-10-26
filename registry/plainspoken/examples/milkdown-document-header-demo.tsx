"use client";

import { useState } from "react";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { countWords } from "@/registry/plainspoken/blocks/milkdown/format";
import { NotebookPageHeader } from "@/registry/plainspoken/blocks/milkdown/document-header";

/** An RFC in review: edit the title, and set the status from the ⋯ menu. */
export default function MilkdownDocumentHeaderDemo() {
  const [page, setPage] = useState(PAGES.find((p) => p.id === "rfc-0045")!);
  return (
    <div className="max-w-3xl border border-border">
      <NotebookPageHeader
        page={page}
        words={countWords(page.body)}
        onTitleChange={(title) => setPage((p) => ({ ...p, title }))}
        onStatusChange={(status) => setPage((p) => ({ ...p, status }))}
        onDuplicate={() => {}}
        onDelete={() => {}}
        className="border-b-0"
      />
    </div>
  );
}
