"use client";

import { useState } from "react";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "@/registry/plainspoken/lib/icons";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Slider } from "@/registry/plainspoken/ui/slider";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { usePlayer, usePosition } from "@/registry/plainspoken/blocks/music/player-provider";
import { clock, spokenTime } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

const REPEAT_LABEL = { off: "Repeat: off", all: "Repeat: all", one: "Repeat: one" } as const;

export interface TransportProps {
  /** Height of the buttons; the play button is one of them, in the main colour */
  size?: ControlSize;
  /** Leave out shuffle and repeat (a phone's mini player) */
  bare?: boolean;
  className?: string;
}

/**
 * Shuffle, previous, play/pause, next and repeat. Shuffle and repeat are toggle buttons
 * (aria-pressed); repeat goes off → all → one, says which in its name, and shows a 1 for "one".
 * Previous goes back to the start of the track first, like a CD player.
 */
export function Transport({ size, bare = false, className }: TransportProps) {
  const p = usePlayer();
  const none = !p.current;
  return (
    <div role="group" aria-label="Playback" className={cn("flex items-center justify-center gap-1", controlSize(size), className)}>
      {!bare && <Toggle variant="ghost" icon={Shuffle} label="Shuffle" pressed={p.shuffle} onPressedChange={p.toggleShuffle} disabled={none} />}
      <IconButton variant="ghost" icon={SkipBack} label="Previous" onClick={p.previous} disabled={none} />
      <IconButton
        variant="primary"
        label={p.playing ? "Pause" : "Play"}
        icon={<Icon icon={p.playing ? Pause : Play} className="fill-current" />}
        onClick={p.toggle}
        disabled={none}
      />
      <IconButton variant="ghost" icon={SkipForward} label="Next" onClick={p.next} disabled={none} />
      {!bare && (
        <Toggle
          variant="ghost"
          icon={Repeat}
          iconPressed={p.repeat === "one" ? Repeat1 : Repeat}
          label={REPEAT_LABEL[p.repeat]}
          pressed={p.repeat !== "off"}
          onPressedChange={p.cycleRepeat}
          disabled={none}
        />
      )}
    </div>
  );
}

export interface SeekBarProps {
  /** Times above the bar at both ends (the big player) instead of beside it */
  stacked?: boolean;
  size?: ControlSize;
  className?: string;
}

/**
 * Elapsed time, the seek slider and the time left. While you drag, the thumb follows you and the
 * playback carries on underneath; letting go seeks. Screen readers hear "1 minute 23 seconds of
 * 3 minutes 42 seconds", and the browser's slider keys work (←/→ a second, Page Up/Down ten
 * percent, Home/End).
 */
export function SeekBar({ stacked = false, size = "sm", className }: SeekBarProps) {
  const p = usePlayer();
  const position = usePosition();
  const [scrub, setScrub] = useState<number | null>(null);
  const duration = p.track?.duration ?? 0;
  const at = scrub ?? position;
  const slider = (
    <Slider
      aria-label="Seek"
      size={size}
      min={0}
      max={Math.max(1, duration)}
      step={1}
      value={Math.floor(at)}
      disabled={!p.track}
      format={(v) => `${spokenTime(v)} of ${spokenTime(duration)}`}
      onChange={setScrub}
      onCommit={(v) => {
        p.seek(v);
        setScrub(null);
      }}
      className="min-w-0 flex-1"
    />
  );
  const elapsed = <span className="text-[12px] text-muted-foreground tabular-nums">{p.track ? clock(at) : "-:--"}</span>;
  const left = <span className="text-[12px] text-muted-foreground tabular-nums">{p.track ? `−${clock(duration - at)}` : "-:--"}</span>;
  if (stacked)
    return (
      <div className={cn("flex flex-col", className)}>
        {slider}
        <div aria-hidden className="flex justify-between">
          {elapsed}
          {left}
        </div>
      </div>
    );
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span aria-hidden className="w-10 text-right">
        {elapsed}
      </span>
      {slider}
      <span aria-hidden className="w-10">
        {left}
      </span>
    </div>
  );
}

/** Mute and the volume slider. The speaker shows the level (none, low, high); M mutes from anywhere. */
export function VolumeControl({ size, className }: { size?: ControlSize; className?: string }) {
  const p = usePlayer();
  const level = p.muted ? 0 : p.volume;
  return (
    <div className={cn("flex min-w-0 items-center gap-1", controlSize(size), className)}>
      <Toggle
        variant="ghost"
        label="Mute"
        pressed={p.muted}
        onPressedChange={p.toggleMute}
        icon={level === 0 ? VolumeX : level < 50 ? Volume1 : Volume2}
        className="aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:hover:bg-secondary"
      />
      <Slider aria-label="Volume" size={size} value={level} onChange={p.setVolume} format={(v) => `${v}%`} className="w-24 min-w-0 flex-1" />
    </div>
  );
}
