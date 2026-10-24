"use client";

import { useState } from "react";
import { Switch } from "@/registry/plainspoken/ui/switch";

export default function SwitchDemo() {
  const [on, setOn] = useState(true);
  const [beta, setBeta] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Switch checked={on} onChange={setOn} label="Auto-refresh" />
      <Switch checked={beta} onChange={setBeta} label="Beta features" description="Takes effect immediately." />
      <Switch checked={false} onChange={() => {}} label="Disabled" disabled />
    </div>
  );
}
