"use client";

import { useState } from "react";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";

const COLUMNS = ["Customer", "Status", "Items", "Total", "Placed"] as const;

/** Checkbox and radio items leave the menu open, so several columns can be switched in a row. */
export default function DropdownMenuCheckboxes() {
  const [shown, setShown] = useState<string[]>(["Customer", "Status", "Total"]);
  const [sort, setSort] = useState("newest");
  const [density, setDensity] = useState("compact");
  const items: MenuItem[] = [
    { type: "label", label: "Columns" },
    ...COLUMNS.map(
      (c): MenuItem => ({
        type: "checkbox",
        label: c,
        checked: shown.includes(c),
        onCheckedChange: (on) => setShown(on ? COLUMNS.filter((x) => x === c || shown.includes(x)) : shown.filter((x) => x !== c)),
      }),
    ),
    { type: "separator" },
    {
      type: "radio",
      label: "Sort by",
      value: sort,
      onValueChange: setSort,
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
        { value: "total", label: "Largest total" },
      ],
    },
    { type: "separator" },
    {
      type: "submenu",
      label: "Row height",
      items: [
        {
          type: "radio",
          value: density,
          onValueChange: setDensity,
          options: [
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfortable" },
          ],
        },
      ],
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu trigger="View" chevron items={items} size="sm" />
      <span className="text-muted-foreground">
        {shown.join(", ")} · {sort} · {density}
      </span>
    </div>
  );
}
