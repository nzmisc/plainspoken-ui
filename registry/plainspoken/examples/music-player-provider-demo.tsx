"use client";

import { LikeButton, MusicProvider, PlayCollectionButton, usePlayer, usePosition } from "@/registry/plainspoken/blocks/music/player-provider";
import { albumById, artistNames, clock, hrefFor } from "@/registry/plainspoken/blocks/music/data";

function NowPlaying() {
  const p = usePlayer();
  const position = usePosition();
  if (!p.track) return <p className="text-muted-foreground">Nothing playing. Press play.</p>;
  return (
    <p className="flex items-center gap-2">
      <LikeButton trackId={p.track.id} size="sm" />
      <span>
        <b>{p.track.title}</b> by {artistNames(p.track)}{" "}
        <span className="text-muted-foreground tabular-nums">
          {clock(position)} / {clock(p.track.duration)} · {p.playing ? "playing" : "paused"}
        </span>
      </span>
    </p>
  );
}

/** The provider holds the player and the library; anything inside can play a collection, read the position or like a track. */
export default function MusicPlayerProviderDemo() {
  const a = albumById("tidewater")!;
  return (
    <MusicProvider>
      <div className="flex items-center gap-3">
        <PlayCollectionButton context={{ kind: "album", id: a.id, title: a.title, href: hrefFor.album(a.id) }} trackIds={a.trackIds} size="lg" />
        <NowPlaying />
      </div>
    </MusicProvider>
  );
}
