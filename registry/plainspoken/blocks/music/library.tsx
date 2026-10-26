"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, LayoutGrid, List } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Select } from "@/registry/plainspoken/ui/select";
import { Toggle, ToggleGroup } from "@/registry/plainspoken/ui/toggle";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { AlbumCard, ArtistCard, CardGrid, MediaCard, PlaylistCard } from "@/registry/plainspoken/blocks/music/media-card";
import { useLibrary } from "@/registry/plainspoken/blocks/music/player-provider";
import { LIBRARY_DATES, YOU, addedAgo, albumById, artistById, hrefFor, initialsOf, playlistById } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

type Kind = "playlist" | "album" | "artist";

interface Item {
  kind: Kind;
  id: string;
  title: string;
  /** "Playlist · Robin Achterberg", "Album · Halvard", "Artist" */
  sub: string;
  creator: string;
  added: string;
  played: string;
}

const SORTS = [
  { value: "recents", label: "Recents" },
  { value: "added", label: "Recently added" },
  { value: "alpha", label: "Alphabetical" },
  { value: "creator", label: "Creator" },
];

const FILTERS: [Kind, string][] = [
  ["playlist", "Playlists"],
  ["album", "Albums"],
  ["artist", "Artists"],
];

const dates = (id: string) => LIBRARY_DATES[id] ?? { added: "2026-10-24", played: "2026-10-24" };

/**
 * Your Library: the playlists, albums and artists you saved or follow, with chips to show one
 * kind, a sort order (recently played, recently added, A–Z, creator), and a list or grid view.
 * Liked Songs comes first in Recents.
 */
export function MusicLibrary({ defaultView = "list" }: { defaultView?: "list" | "grid" }) {
  const lib = useLibrary();
  const [filter, setFilter] = useState<Kind | null>(null);
  const [sort, setSort] = useState("recents");
  const [view, setView] = useState<string | null>(defaultView);

  const items: Item[] = [
    ...lib.playlists.flatMap((id) => {
      const p = playlistById(id);
      return p ? [{ kind: "playlist" as const, id, title: p.title, sub: `Playlist · ${p.owner}`, creator: p.owner, ...dates(id) }] : [];
    }),
    ...lib.albums.flatMap((id) => {
      const a = albumById(id);
      if (!a) return [];
      const by = artistById(a.artistId).name;
      return [{ kind: "album" as const, id, title: a.title, sub: `${a.kind} · ${by}`, creator: by, ...dates(id) }];
    }),
    ...lib.artists.map((id) => ({ kind: "artist" as const, id, title: artistById(id).name, sub: "Artist", creator: artistById(id).name, ...dates(id) })),
  ];
  const by: Record<string, (a: Item, b: Item) => number> = {
    recents: (a, b) => b.played.localeCompare(a.played),
    added: (a, b) => b.added.localeCompare(a.added),
    alpha: (a, b) => a.title.localeCompare(b.title),
    creator: (a, b) => a.creator.localeCompare(b.creator) || a.title.localeCompare(b.title),
  };
  const shown = items.filter((i) => !filter || i.kind === filter).sort(by[sort]);
  const showLiked = !filter || filter === "playlist";
  const likedCount = Object.keys(lib.liked).length;
  const grid = view === "grid";

  return (
    <div className="flex flex-col gap-3 px-1.5 py-4 md:px-3.5">
      <h1 className="px-1.5 text-[24px] font-bold">Your Library</h1>
      <div className="ctl-sm flex flex-wrap items-center gap-2 px-1.5">
        <div role="group" aria-label="Show only" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, label]) => (
            <Chip key={k} pressed={filter === k} onPressedChange={(on) => setFilter(on ? k : null)}>
              {label}
            </Chip>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground">
          Sort by
          <Select options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
        </label>
        <ToggleGroup type="single" label="View" value={view} onValueChange={(v) => v && setView(v)}>
          <Toggle value="list" icon={List} label="List" />
          <Toggle value="grid" icon={LayoutGrid} label="Grid" />
        </ToggleGroup>
      </div>

      {shown.length === 0 && !showLiked ? (
        <EmptyState title="Nothing here yet" description="Save albums and follow artists, and they show up here." />
      ) : grid ? (
        <CardGrid>
          {showLiked && (
            <li>
              <MediaCard
                href={hrefFor.playlist("liked")}
                seed="liked-songs"
                title="Liked Songs"
                subtitle={`Playlist · ${likedCount} songs`}
                cover={<LikedCover big />}
              />
            </li>
          )}
          {shown.map((i) => (
            <li key={`${i.kind}-${i.id}`}>
              {i.kind === "playlist" ? <PlaylistCard id={i.id} /> : i.kind === "album" ? <AlbumCard id={i.id} byArtist /> : <ArtistCard id={i.id} />}
            </li>
          ))}
        </CardGrid>
      ) : (
        <ul className="flex flex-col px-1.5" aria-label="Library">
          {showLiked && (
            <Row
              href={hrefFor.playlist("liked")}
              title="Liked Songs"
              sub={`Playlist · ${YOU.name} · ${likedCount} songs`}
              when="Pinned"
              cover={<LikedCover />}
            />
          )}
          {shown.map((i) => (
            <Row
              key={`${i.kind}-${i.id}`}
              href={i.kind === "playlist" ? hrefFor.playlist(i.id) : i.kind === "album" ? hrefFor.album(i.id) : hrefFor.artist(i.id)}
              title={i.title}
              sub={i.sub}
              when={sort === "added" ? `Added ${addedAgo(i.added)}` : `Played ${addedAgo(i.played)}`}
              cover={<Artwork seed={i.id} initials={i.kind === "artist" ? initialsOf(i.title) : undefined} size={44} className="border border-border" />}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Liked Songs has no artwork of its own: a heart on the main colour */
export function LikedCover({ big = false }: { big?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center border border-border bg-primary text-primary-foreground",
        big ? "aspect-square w-full" : "size-11",
      )}
    >
      <Icon icon={Heart} size={big ? "35%" : 20} className="fill-current" />
    </span>
  );
}

function Row({ href, title, sub, when, cover }: { href: string; title: string; sub: string; when: string; cover: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 border-b border-border px-1.5 py-1.5 text-foreground no-underline visited:text-foreground hover:bg-secondary",
          FOCUS_RING,
          "focus-visible:-outline-offset-2",
        )}
      >
        {cover}
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="truncate font-semibold">{title}</span>
          <span className="truncate text-[13px] text-muted-foreground">{sub}</span>
        </span>
        <span className="shrink-0 text-[13px] text-muted-foreground max-sm:hidden">{when}</span>
      </Link>
    </li>
  );
}
