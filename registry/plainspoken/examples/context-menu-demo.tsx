"use client";

import { useState } from "react";
import { Copy, Download, File, FileText, Folder, Image, Pencil, Share2, Star, Trash } from "@/registry/plainspoken/lib/icons";
import { ContextMenu } from "@/registry/plainspoken/ui/context-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";

const FILES = [
  { name: "Contracts", kind: "Folder", size: "—", icon: Folder },
  { name: "Q3 budget.xlsx", kind: "Spreadsheet", size: "84 KB", icon: File },
  { name: "Brand guidelines.pdf", kind: "PDF", size: "2.1 MB", icon: FileText },
  { name: "Team photo.jpg", kind: "Image", size: "3.4 MB", icon: Image },
];

/**
 * Right-click a row (or long-press it, or focus it and press Shift+F10 or the Menu key). The items
 * come from a function of the row that was clicked.
 */
export default function ContextMenuDemo() {
  const [starred, setStarred] = useState<string[]>(["Contracts"]);
  const [last, setLast] = useState("");
  const nameOf = (el: Element) => el.closest<HTMLElement>("[data-file]")?.dataset.file;
  return (
    <div className="flex flex-col gap-2">
      <ContextMenu
        label="File actions"
        items={(target) => {
          const name = nameOf(target);
          if (!name) return [{ label: "New folder", icon: Folder, onSelect: () => setLast("New folder") }];
          const did = (what: string) => () => setLast(`${what}: ${name}`);
          return [
            { type: "label", label: name },
            { label: "Open", onSelect: did("Open") },
            { label: "Share…", icon: Share2, onSelect: did("Share") },
            { label: "Copy link", icon: Copy, shortcut: "⌘L", onSelect: did("Copy link") },
            { label: "Download", icon: Download, onSelect: did("Download") },
            { type: "separator" },
            {
              type: "checkbox",
              label: "Starred",
              checked: starred.includes(name),
              onCheckedChange: (on) => setStarred(on ? [...starred, name] : starred.filter((s) => s !== name)),
            },
            { label: "Rename", icon: Pencil, shortcut: "F2", onSelect: did("Rename") },
            { type: "separator" },
            { label: "Move to Trash", icon: Trash, destructive: true, onSelect: did("Move to Trash") },
          ];
        }}
        className="max-w-xl border border-border"
      >
        <table className="w-full border-collapse text-[14px] [&_td]:px-2 [&_td]:py-1 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th className="text-right">Size</th>
            </tr>
          </thead>
          <tbody>
            {FILES.map((f) => (
              <tr key={f.name} data-file={f.name} tabIndex={0} className="hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                <td>
                  <Icon icon={f.icon} className="mr-1.5 text-muted-foreground" />
                  {f.name}
                  {starred.includes(f.name) && <Icon icon={Star} label="Starred" className="ml-1.5 text-warning" />}
                </td>
                <td>{f.kind}</td>
                <td className="text-right tabular-nums">{f.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-border px-2 py-6 text-center text-muted-foreground">Right-click a file, or the empty space here</p>
      </ContextMenu>
      <p className="text-muted-foreground" aria-live="polite">
        {last || "Nothing chosen yet."}
      </p>
    </div>
  );
}
