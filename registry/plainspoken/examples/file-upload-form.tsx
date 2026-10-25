"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { FileUpload, formatSize, type UploadItem } from "@/registry/plainspoken/ui/file-upload";

/**
 * Without an upload function the files are only checked and listed as ready. With a name they go in
 * the hidden file input, so a plain form post, or new FormData(form), sends them with the rest.
 */
export default function FileUploadForm() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  const ready = items.filter((i) => i.status === "ready");
  return (
    <form
      className="flex max-w-xl flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const files = new FormData(e.currentTarget).getAll("attachments") as File[];
        setSent(`The form would send ${files.length} file${files.length === 1 ? "" : "s"}, ${formatSize(files.reduce((a, f) => a + f.size, 0))}.`);
      }}
    >
      <FileUpload label="Attachments" name="attachments" maxFiles={3} maxSize={5 * 1024 * 1024} onItemsChange={setItems} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={ready.length === 0}>
          Send message
        </Button>
        <span role="status" className="text-[13px] text-muted-foreground">
          {sent}
        </span>
      </div>
    </form>
  );
}
