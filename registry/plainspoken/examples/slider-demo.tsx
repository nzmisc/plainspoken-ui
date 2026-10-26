"use client";

import { useState } from "react";
import { Slider } from "@/registry/plainspoken/ui/slider";

/** With a label, the label and the formatted value share a line above the track; screen readers hear the formatted value too. */
export default function SliderDemo() {
  const [warn, setWarn] = useState(80);
  const [budget, setBudget] = useState(250);
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Slider label="Warn when storage is over" value={warn} onChange={setWarn} min={50} max={95} step={5} format={(v) => `${v}%`} />
      <Slider
        label="Monthly budget"
        value={budget}
        onChange={setBudget}
        min={0}
        max={1000}
        step={50}
        marks={[0, 250, 500, 750, 1000]}
        format={(v) => `$${v}`}
      />
      <Slider label="Retention" defaultValue={30} max={90} format={(v) => `${v} days`} disabled />
    </div>
  );
}
