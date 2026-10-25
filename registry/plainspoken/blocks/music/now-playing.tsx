"use client";

import Link from "next/link";
import { ListMusic } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { LikeButton, usePlayer } from "@/registry/plainspoken/blocks/music/player-provider";
import { SeekBar, Transport, VolumeControl } from "@/registry/plainspoken/blocks/music/player-controls";
import { albumById, artistById, hrefFor } from "@/registry/plainspoken/blocks/music/data";

const LINK = "text-foreground no-underline visited:text-foreground hover:underline";

/**
 * The big player: the cover as large as the screen allows, title and artists, the like button, a
 * large seek bar with both times, the transport at touch size, and volume. What a phone shows
 * when you tap the mini player; links inside close it on their way to the page.
 */
export function NowPlayingView({ onNavigate, onShowQueue }: { onNavigate?: () => void; onShowQueue?: () => void }) {
  const p = usePlayer();
  const t = p.track;
  if (!t) return <EmptyState title="Nothing playing" description="Pick an album or a playlist to start." />;
  const album = albumById(t.albumId);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:items-start sm:gap-5">
      <Artwork
        seed={t.albumId}
        title={album?.title}
        size="100%"
        className="mx-auto max-w-[min(100%,46dvh)] border border-border sm:mx-0 sm:w-64 sm:max-w-none"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {p.context && (
          <p className="text-[13px] text-muted-foreground">
            Playing from{" "}
            {p.context.kind === "album" ? "the album" : p.context.kind === "artist" ? "the artist" : p.context.kind === "search" ? "search" : "the playlist"}{" "}
            {p.context.href ? (
              <Link href={p.context.href} onClick={onNavigate} className="font-semibold text-foreground underline visited:text-foreground">
                {p.context.title}
              </Link>
            ) : (
              <b className="text-foreground">{p.context.title}</b>
            )}
          </p>
        )}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[20px] leading-tight font-bold">
              <Link href={hrefFor.album(t.albumId)} onClick={onNavigate} className={LINK}>
                {t.title}
              </Link>
            </h3>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
              {t.artistIds.map((id, i) => (
                <span key={id}>
                  {i > 0 && ", "}
                  <Link
                    href={hrefFor.artist(id)}
                    onClick={onNavigate}
                    className="text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {artistById(id).name}
                  </Link>
                </span>
              ))}
            </p>
          </div>
          <LikeButton trackId={t.id} size="lg" />
        </div>
        <SeekBar stacked size="md" />
        <Transport size="lg" className="gap-3" />
        <VolumeControl size="md" className="max-sm:hidden" />
        {onShowQueue && (
          <Button variant="outline" icon={ListMusic} onClick={onShowQueue} className="self-start">
            Queue
          </Button>
        )}
      </div>
    </div>
  );
}

export interface NowPlayingDialogProps {
  open: boolean;
  onClose: () => void;
  onShowQueue?: () => void;
}

/** The big player in a dialog: full screen on phones, a large box on wider screens. Escape or the × closes it. */
export function NowPlayingDialog({ open, onClose, onShowQueue }: NowPlayingDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Now playing" size="lg">
      <NowPlayingView onNavigate={onClose} onShowQueue={onShowQueue} />
    </Dialog>
  );
}
