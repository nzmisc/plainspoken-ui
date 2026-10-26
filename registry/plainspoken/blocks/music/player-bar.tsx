"use client";

import Link from "next/link";
import { useState } from "react";
import { Keyboard, ListMusic, Maximize2, Pause, Play } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { LikeButton, usePlayer, usePosition } from "@/registry/plainspoken/blocks/music/player-provider";
import { SeekBar, Transport, VolumeControl } from "@/registry/plainspoken/blocks/music/player-controls";
import { QueueDrawer } from "@/registry/plainspoken/blocks/music/queue";
import { NowPlayingDialog } from "@/registry/plainspoken/blocks/music/now-playing";
import { artistById, artistNames, hrefFor } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

const TITLE_LINK = "truncate font-semibold text-foreground no-underline visited:text-foreground hover:underline";
const ARTIST_LINK = "text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground hover:underline";

/** A thin line along the top edge of the phone bar: how far into the track, at a glance */
function ProgressLine() {
  const p = usePlayer();
  const position = usePosition();
  const pct = p.track ? (position / p.track.duration) * 100 : 0;
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface PlayerBarProps {
  /** Opens the keyboard shortcuts; leave out to hide the button */
  onShowShortcuts?: () => void;
  className?: string;
}

/**
 * The bar along the bottom of the music app, on every page. Wide screens get three parts: what's
 * playing (cover, title, artists, like), the transport with the seek bar, and queue, big player
 * and volume. Phones get a mini player: cover, title and artists (tap for the big player), like
 * and play, with a thin progress line on top. The queue opens in a drawer, the big player in a
 * dialog. Announces nothing on its own: the titles change quietly, the buttons say what they do.
 */
export function PlayerBar({ onShowShortcuts, className }: PlayerBarProps) {
  const p = usePlayer();
  const [queue, setQueue] = useState(false);
  const [big, setBig] = useState(false);
  const t = p.track;

  return (
    <section aria-label="Player" data-slot="music-player-bar" className={cn("relative shrink-0 border-t border-border bg-muted", className)}>
      {/* Phones */}
      <div className="relative flex h-14 items-center gap-2 px-2 md:hidden">
        <ProgressLine />
        {t ? (
          <button
            type="button"
            onClick={() => setBig(true)}
            aria-label={`Open the player: ${t.title} by ${artistNames(t)}`}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Artwork seed={t.albumId} size={40} className="border border-border" />
            <span className="flex min-w-0 flex-col leading-tight">
              <b className="truncate">{t.title}</b>
              <span className="truncate text-[13px] text-muted-foreground">{artistNames(t)}</span>
            </span>
          </button>
        ) : (
          <span className="flex-1 text-muted-foreground">Nothing playing</span>
        )}
        {t && <LikeButton trackId={t.id} size="lg" />}
        <IconButton
          size="lg"
          variant="ghost"
          label={p.playing ? "Pause" : "Play"}
          icon={<Icon icon={p.playing ? Pause : Play} className="fill-current" />}
          onClick={p.toggle}
          disabled={!t}
        />
      </div>

      {/* Wide screens */}
      <div className="hidden h-[72px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-4 px-3 md:grid">
        <div className="flex min-w-0 items-center gap-2.5">
          {t ? (
            <>
              <Link href={hrefFor.album(t.albumId)} tabIndex={-1} aria-hidden className="shrink-0">
                <Artwork seed={t.albumId} size={52} className="border border-border" />
              </Link>
              <div className="flex min-w-0 flex-col leading-snug">
                <Link href={hrefFor.album(t.albumId)} className={TITLE_LINK}>
                  {t.title}
                </Link>
                <span className="truncate text-[13px]">
                  {t.artistIds.map((id, i) => (
                    <span key={id}>
                      {i > 0 && <span className="text-muted-foreground">, </span>}
                      <Link href={hrefFor.artist(id)} className={ARTIST_LINK}>
                        {artistById(id).name}
                      </Link>
                    </span>
                  ))}
                </span>
              </div>
              <LikeButton trackId={t.id} size="sm" />
            </>
          ) : (
            <span className="text-muted-foreground">Nothing playing. Pick an album or a playlist.</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col items-stretch">
          <Transport size="sm" />
          <SeekBar size="xs" />
        </div>
        <div className="ctl-sm flex min-w-0 items-center justify-end gap-1">
          {onShowShortcuts && <IconButton variant="ghost" icon={Keyboard} label="Keyboard shortcuts" onClick={onShowShortcuts} className="max-lg:hidden" />}
          <Toggle variant="ghost" icon={ListMusic} label="Queue" pressed={queue} onPressedChange={setQueue} />
          <IconButton variant="ghost" icon={Maximize2} label="Open the big player" onClick={() => setBig(true)} disabled={!t} />
          <VolumeControl className="max-w-36 flex-1" />
        </div>
      </div>

      <QueueDrawer open={queue} onClose={() => setQueue(false)} />
      <NowPlayingDialog
        open={big}
        onClose={() => setBig(false)}
        onShowQueue={() => {
          setBig(false);
          setQueue(true);
        }}
      />
    </section>
  );
}
