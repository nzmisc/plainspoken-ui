"use client";

import { useState } from "react";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";

export default function SegmentedControlDemo() {
  const [range, setRange] = useState("7d");
  const [view, setView] = useState("list");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl label="Range" value={range} onChange={setRange} options={["24h", "7d", "30d", "1y"]} />
      <SegmentedControl
        label="View"
        size="sm"
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: "List" },
          { value: "board", label: "Board" },
          { value: "calendar", label: "Calendar" },
        ]}
      />
    </div>
  );
}
