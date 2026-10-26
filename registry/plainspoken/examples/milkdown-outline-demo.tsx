"use client";

import { useState } from "react";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { outline } from "@/registry/plainspoken/blocks/milkdown/format";
import { NotebookOutline, OutlineMenu } from "@/registry/plainspoken/blocks/milkdown/outline";

const ENTRIES = outline(PAGES.find((p) => p.id === "validator-latency")!.body);

/**
 * The validator latency runbook's headings, as the rail and as the menu used below xl widths.
 * Choosing one marks it here; in the notebook it scrolls the text there too.
 */
export default function MilkdownOutlineDemo() {
  const [current, setCurrent] = useState(1);
  return (
    <div className="flex flex-wrap items-start gap-8">
      <NotebookOutline entries={ENTRIES} current={current} onSelect={setCurrent} className="w-60" />
      <OutlineMenu entries={ENTRIES} current={current} onSelect={setCurrent} />
    </div>
  );
}
