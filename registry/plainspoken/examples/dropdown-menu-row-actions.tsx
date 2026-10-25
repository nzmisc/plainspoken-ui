"use client";

import { useState } from "react";
import { Copy, Ellipsis, ExternalLink, Pencil, Trash } from "@/registry/plainspoken/lib/icons";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";

const INITIAL = [
  { name: "storefront-2026", url: "storefront-2026.northwind.app", updated: "2 hours ago" },
  { name: "docs", url: "docs.northwind.app", updated: "yesterday" },
  { name: "status-page", url: "status.northwind.app", updated: "12 Oct" },
];

/** A ⋯ menu at the end of each table row, aligned to the button's right edge so it stays over the table. */
export default function DropdownMenuRowActions() {
  const [rows, setRows] = useState(INITIAL);
  return (
    <table className="w-full max-w-xl border-collapse text-[14px] [&_td]:border-b [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium">
      <thead>
        <tr>
          <th>Project</th>
          <th>Updated</th>
          <th className="w-0">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>
              <span className="font-medium">{r.name}</span> <span className="text-muted-foreground">{r.url}</span>
            </td>
            <td className="whitespace-nowrap">{r.updated}</td>
            <td className="!px-0.5">
              <DropdownMenu
                trigger={Ellipsis}
                label={`Actions for ${r.name}`}
                triggerVariant="ghost"
                size="sm"
                align="end"
                items={[
                  { label: "Open", icon: ExternalLink, href: `#${r.url}` },
                  { label: "Rename", icon: Pencil },
                  { label: "Duplicate", icon: Copy, onSelect: () => setRows((rs) => [...rs, { ...r, name: `${r.name}-copy`, updated: "just now" }]) },
                  { type: "separator" },
                  { label: "Delete", icon: Trash, destructive: true, onSelect: () => setRows((rs) => rs.filter((x) => x !== r)) },
                ]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
