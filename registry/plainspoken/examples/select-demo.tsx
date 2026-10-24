"use client";

import { useState } from "react";
import { Select } from "@/registry/plainspoken/ui/select";

export default function SelectDemo() {
  const [zone, setZone] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3 text-[14px]">
      <Select
        aria-label="Time zone"
        placeholder="Choose a time zone…"
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        options={[
          { group: "Europe", options: [{ value: "Europe/Berlin", label: "Berlin" }, { value: "Europe/London", label: "London" }] },
          { group: "Americas", options: [{ value: "America/New_York", label: "New York" }, { value: "America/Los_Angeles", label: "Los Angeles" }] },
        ]}
      />
      <span className="text-muted-foreground">{zone ? `Chosen: ${zone}` : "Nothing chosen"}</span>
    </div>
  );
}
