"use client";

import { useState } from "react";
import { Bell, BellOff, Bold, Eye, Pin, Star } from "@/registry/plainspoken/lib/icons";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

/** A pressed toggle fills with the main colour (a ghost one gains a border and a gray fill). Icon-only toggles take a label. */
export default function ToggleDemo() {
  const [muted, setMuted] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle icon={Star} defaultPressed>
        Starred
      </Toggle>
      <Toggle variant="outline" icon={Eye}>
        Watch
      </Toggle>
      <Toggle icon={Bold} label="Bold" />
      <Toggle variant="ghost" icon={Pin} label="Pin conversation" defaultPressed />
      <Toggle variant="ghost" icon={Bell} iconPressed={BellOff} label="Mute notifications" pressed={muted} onPressedChange={setMuted} />
      <Toggle disabled>Disabled</Toggle>
    </div>
  );
}
