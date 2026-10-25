"use client";

import { useState } from "react";
import { Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

/**
 * Ghost toggles in a player: shuffle, repeat (a second press switches to "repeat one" with its own
 * icon), and like, whose heart fills when pressed (aria-pressed:[&_svg]:fill-current).
 */
export default function TogglePlayer() {
  const [playing, setPlaying] = useState(true);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  return (
    <div className="flex items-center gap-1">
      <Toggle variant="ghost" icon={Shuffle} label="Shuffle" />
      <IconButton variant="ghost" icon={SkipBack} label="Previous track" />
      <IconButton variant="primary" icon={playing ? Pause : Play} label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} />
      <IconButton variant="ghost" icon={SkipForward} label="Next track" />
      <Toggle
        variant="ghost"
        icon={repeat === "one" ? Repeat1 : Repeat}
        label={repeat === "one" ? "Repeat one" : "Repeat"}
        pressed={repeat !== "off"}
        onPressedChange={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
      />
      <Toggle variant="ghost" icon={Heart} label="Like" className="ml-3 aria-pressed:[&_svg]:fill-current" />
    </div>
  );
}
