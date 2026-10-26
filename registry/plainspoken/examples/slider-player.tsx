"use client";

import { useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Slider } from "@/registry/plainspoken/ui/slider";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const LENGTH = 296;

/**
 * Bare tracks (no label, an aria-label instead) as a player's seek and volume bars. The track box
 * is a control's height, so it lines up with the buttons; format gives screen readers "1:23 of
 * 4:56" rather than "83"; onCommit fires once when the reader lets go, the moment to seek.
 */
export default function SliderPlayer() {
  const [at, setAt] = useState(83);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  return (
    <div className="ctl-sm flex max-w-xl flex-col gap-1 border border-border p-2">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground tabular-nums">
        <span className="w-9 text-right">{time(at)}</span>
        <Slider aria-label="Seek" value={at} onChange={setAt} max={LENGTH} format={(v) => `${time(v)} of ${time(LENGTH)}`} className="flex-1" />
        <span className="w-9">{time(LENGTH)}</span>
      </div>
      <div className="flex items-center gap-1">
        <IconButton variant="ghost" icon={SkipBack} label="Previous track" />
        <IconButton variant="primary" icon={playing ? Pause : Play} label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} />
        <IconButton variant="ghost" icon={SkipForward} label="Next track" />
        <span className="ml-auto flex w-40 items-center gap-1">
          <Toggle variant="ghost" icon={Volume2} iconPressed={VolumeX} label="Mute" pressed={muted} onPressedChange={setMuted} />
          <Slider aria-label="Volume" value={muted ? 0 : volume} onChange={setVolume} format={(v) => `${v}%`} disabled={muted} className="flex-1" />
        </span>
      </div>
    </div>
  );
}
