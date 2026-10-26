"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AudioLines,
  Clock,
  Disc3,
  Ellipsis,
  Heart,
  Link2,
  ListEnd,
  ListPlus,
  ListStart,
  MicVocal,
  Pause,
  Play,
  Search,
  Trash,
} from "@/registry/plainspoken/lib/icons";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { ContextMenu } from "@/registry/plainspoken/ui/context-menu";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { LikeButton, useLibrary, usePlayer, type Library, type PlayContext, type Player } from "@/registry/plainspoken/blocks/music/player-provider";
import {
  PLAYLISTS,
  YOU,
  addedAgo,
  albumById,
  artistById,
  artistNames,
  clock,
  formatCount,
  hrefFor,
  playlistById,
  trackById,
  type PlaylistEntry,
  type Track,
} from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

const MUTED_LINK = "text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground hover:underline";

export interface TrackColumns {
  /** The album's cover before the title (playlists, search); albums leave it out */
  artwork?: boolean;
  album?: boolean;
  /** "Date added", from each entry's `added` */
  added?: boolean;
  /** Play count (an artist's popular tracks) */
  plays?: boolean;
  /** Artists under the title. Default true; an album of one artist can leave them out. */
  artists?: boolean;
}

/** The ⋯ and right-click menu of a track */
function trackMenu(t: Track, p: Player, lib: Library, push: (href: string) => void, playlistId?: string): MenuItem[] {
  const own = PLAYLISTS.filter((pl) => pl.owner === YOU.name);
  const liked = lib.isLiked(t.id);
  return [
    { label: "Play next", icon: ListStart, onSelect: () => p.playNext(t.id) },
    { label: "Add to queue", icon: ListEnd, onSelect: () => p.addToQueue(t.id) },
    { type: "separator" },
    { label: liked ? "Remove from Liked Songs" : "Save to Liked Songs", icon: Heart, onSelect: () => lib.toggleLike(t.id) },
    {
      type: "submenu",
      label: "Add to playlist",
      icon: ListPlus,
      items: own.map((pl) => ({ label: pl.title, onSelect: () => lib.addToPlaylist(pl.id, t.id) })),
    },
    ...(playlistId && playlistById(playlistId)?.owner === YOU.name
      ? [{ label: "Remove from this playlist", icon: Trash, destructive: true, onSelect: () => lib.removeFromPlaylist(playlistId, t.id) } satisfies MenuItem]
      : []),
    { type: "separator" },
    { label: "Go to album", icon: Disc3, onSelect: () => push(hrefFor.album(t.albumId)) },
    { label: "Go to artist", icon: MicVocal, onSelect: () => push(hrefFor.artist(t.artistIds[0])) },
    {
      label: "Copy song link",
      icon: Link2,
      onSelect: () => {
        const url = `${location.origin}${hrefFor.album(t.albumId)}?track=${encodeURIComponent(t.id)}`;
        navigator.clipboard?.writeText(url).then(
          () => toast({ title: "Link copied", description: t.title }),
          () => toast({ title: "Couldn't copy the link", variant: "warning" }),
        );
      },
    },
  ];
}

export interface TrackTableProps {
  /** The tracks, in order, with the date each was added where that matters */
  entries: PlaylistEntry[] | { trackId: string; added?: string }[];
  /** What plays when a row is played: the whole list as that context, from the chosen row */
  context: PlayContext;
  columns?: TrackColumns;
  /** The playlist these are from, for "Remove from this playlist" (on your own playlists) */
  playlistId?: string;
  /** Accessible name of the table: "Night Drive, 30 songs" */
  label: string;
  /** Number the rows from here (an album's second disc, a "show more") */
  startAt?: number;
  className?: string;
}

/**
 * A list of tracks as a table: number, title and artists, album, date added, like, length and a ⋯
 * menu (also on right-click). Hover a row for its play button; double-click a row, or press Enter
 * on it, to play the list from there. The playing track shows a sound-wave mark instead of its
 * number and a bold title.
 *
 * Keyboard: the list is one Tab stop. ↑/↓, Home and End move between rows; Enter plays the row;
 * Tab goes on to that row's buttons (play, like, ⋯), then out of the table.
 */
export function TrackTable({ entries, context, columns = {}, playlistId, label, startAt = 1, className }: TrackTableProps) {
  const { artwork = false, album = false, added = false, plays = false, artists = true } = columns;
  const p = usePlayer();
  const lib = useLibrary();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const rows = useMemo(
    () =>
      entries.flatMap((e) => {
        const t = trackById(e.trackId);
        return t ? [{ t, added: e.added }] : [];
      }),
    [entries],
  );
  const ids = useMemo(() => rows.map((r) => r.t.id), [rows]);
  const loaded = p.isContext(context.kind, context.id);

  const playRow = (id: string) => {
    if (loaded && p.current === id) p.toggle();
    else p.playContext(context, ids, id);
  };

  const focusRow = (i: number) => {
    const n = Math.max(0, Math.min(rows.length - 1, i));
    setActive(n);
    wrap.current?.querySelectorAll<HTMLElement>("[data-track-row]")[n]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-track-row]");
    if (!row || e.target !== row) return;
    const i = Number(row.dataset.index);
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End" || k === "PageDown" || k === "PageUp") {
      e.preventDefault();
      focusRow(k === "ArrowDown" ? i + 1 : k === "ArrowUp" ? i - 1 : k === "Home" ? 0 : k === "End" ? rows.length - 1 : k === "PageDown" ? i + 10 : i - 10);
    } else if (k === "Enter") {
      e.preventDefault();
      playRow(rows[i].t.id);
    }
  };

  if (!rows.length) return null;

  return (
    <ContextMenu
      label="Track"
      items={(target) => {
        const id = target.closest<HTMLElement>("[data-track-row]")?.dataset.trackId;
        const t = id ? trackById(id) : undefined;
        return t ? trackMenu(t, p, lib, router.push, playlistId) : [];
      }}
      className={className}
    >
      <div ref={wrap}>
        <Table rules="rows" frameless aria-label={label} className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-right">#</TableHead>
              <TableHead>Title</TableHead>
              {plays && <TableHead className="hidden w-32 sm:table-cell">Plays</TableHead>}
              {album && <TableHead className="hidden lg:table-cell">Album</TableHead>}
              {added && <TableHead className="hidden w-32 xl:table-cell">Date added</TableHead>}
              <TableHead className="w-9">
                <span className="sr-only">Liked</span>
              </TableHead>
              <TableHead className="w-16">
                <Icon icon={Clock} label="Duration" />
              </TableHead>
              <TableHead className="w-10">
                <span className="sr-only">More</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onKeyDown={onKeyDown}>
            {rows.map(({ t, added: when }, i) => {
              const isCurrent = loaded && p.current === t.id;
              const nowPlaying = isCurrent && p.playing;
              const tab = i === active ? 0 : -1;
              const a = albumById(t.albumId);
              return (
                <TableRow
                  key={`${t.id}-${i}`}
                  data-track-row
                  data-track-id={t.id}
                  data-index={i}
                  tabIndex={tab}
                  aria-current={isCurrent ? "true" : undefined}
                  onFocus={(e) => e.target === e.currentTarget && setActive(i)}
                  onClick={() => setActive(i)}
                  onDoubleClick={() => playRow(t.id)}
                  className="group cursor-default hover:bg-secondary focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&>td]:align-middle"
                >
                  <TableCell className="relative text-right text-muted-foreground tabular-nums">
                    <span className="group-hover:invisible group-focus-within:invisible">
                      {isCurrent ? (
                        <Icon icon={AudioLines} label={nowPlaying ? "Playing" : "Paused"} className={cn("text-foreground", !nowPlaying && "opacity-50")} />
                      ) : (
                        startAt + i
                      )}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-end pr-1">
                      <IconButton
                        size="xs"
                        variant="ghost"
                        tabIndex={tab}
                        label={`${nowPlaying ? "Pause" : "Play"} ${t.title} by ${artistNames(t)}`}
                        icon={<Icon icon={nowPlaying ? Pause : Play} className="fill-current" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          playRow(t.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100"
                      />
                    </span>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex min-w-0 items-center gap-2">
                      {artwork && <Artwork seed={t.albumId} size={36} className="border border-border" />}
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className={cn("truncate", isCurrent && "font-bold")}>{t.title}</span>
                        {(artists || t.explicit) && (
                          <span className="flex min-w-0 items-baseline gap-1 text-[13px]">
                            {t.explicit && (
                              <Badge className="px-1 text-[10px] leading-[14px]" title="Explicit" aria-label="Explicit">
                                E
                              </Badge>
                            )}
                            {artists && (
                              <span className="truncate">
                                {t.artistIds.map((id, j) => (
                                  <span key={id}>
                                    {j > 0 && <span className="text-muted-foreground">, </span>}
                                    <Link href={hrefFor.artist(id)} tabIndex={tab} className={MUTED_LINK}>
                                      {artistById(id).name}
                                    </Link>
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {plays && (
                    <TableCell numeric className="hidden text-muted-foreground sm:table-cell">
                      {formatCount(t.plays)}
                    </TableCell>
                  )}
                  {album && (
                    <TableCell className="hidden truncate lg:table-cell">
                      {a && (
                        <Link href={hrefFor.album(a.id)} tabIndex={tab} className={MUTED_LINK}>
                          {a.title}
                        </Link>
                      )}
                    </TableCell>
                  )}
                  {added && <TableCell className="hidden truncate text-muted-foreground xl:table-cell">{when ? addedAgo(when) : ""}</TableCell>}
                  <TableCell className="px-0.5">
                    <LikeButton trackId={t.id} size="xs" revealOnHover tabIndex={tab} />
                  </TableCell>
                  <TableCell numeric className="text-muted-foreground">
                    {clock(t.duration)}
                  </TableCell>
                  <TableCell className="px-1">
                    <DropdownMenu
                      align="end"
                      label={`More options for ${t.title}`}
                      items={trackMenu(t, p, lib, router.push, playlistId)}
                      trigger={(props) => (
                        <IconButton
                          {...props}
                          size="xs"
                          variant="ghost"
                          tabIndex={tab}
                          icon={Ellipsis}
                          label={`More options for ${t.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onClick?.(e);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 aria-expanded:opacity-100"
                        />
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ContextMenu>
  );
}

const SORTS = [
  { value: "custom", label: "Custom order" },
  { value: "title", label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "added", label: "Date added" },
  { value: "duration", label: "Duration" },
];

export interface PlaylistTracksProps {
  /** A playlist id, or "liked" for Liked Songs */
  playlistId: string;
  title: string;
}

/**
 * A playlist's tracks with this session's edits (songs added, removed, liked), a box to find a
 * song in it, and a sort order. Liked Songs is the newest first.
 */
export function PlaylistTracks({ playlistId, title }: PlaylistTracksProps) {
  const lib = useLibrary();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("custom");
  const all = lib.entriesOf(playlistId);
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withTrack = all.flatMap((e) => {
      const t = trackById(e.trackId);
      return t ? [{ e, t }] : [];
    });
    const found = q ? withTrack.filter(({ t }) => `${t.title} ${artistNames(t)} ${albumById(t.albumId)?.title ?? ""}`.toLowerCase().includes(q)) : withTrack;
    const by: Record<string, (a: (typeof found)[number], b: (typeof found)[number]) => number> = {
      title: (a, b) => a.t.title.localeCompare(b.t.title),
      artist: (a, b) => artistNames(a.t).localeCompare(artistNames(b.t)),
      album: (a, b) => (albumById(a.t.albumId)?.title ?? "").localeCompare(albumById(b.t.albumId)?.title ?? ""),
      added: (a, b) => b.e.added.localeCompare(a.e.added),
      duration: (a, b) => a.t.duration - b.t.duration,
    };
    return (sort in by ? [...found].sort(by[sort]) : found).map(({ e }) => e);
  }, [all, query, sort]);
  const kind = playlistId === "liked" ? "liked" : "playlist";
  return (
    <div className="flex flex-col gap-2">
      <div className="ctl-sm flex flex-wrap items-center gap-2 px-3 md:px-5">
        <Input
          type="search"
          prefix={Search}
          placeholder="Find in playlist"
          aria-label={`Find in ${title}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56 max-w-full"
        />
        <label className="ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground">
          Sort by
          <Select options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
        </label>
      </div>
      {entries.length ? (
        <TrackTable
          entries={entries}
          context={{ kind, id: playlistId, title, href: hrefFor.playlist(playlistId) }}
          columns={{ artwork: true, album: true, added: true }}
          playlistId={playlistId}
          label={`${title}, ${entries.length} songs`}
        />
      ) : (
        <EmptyState
          icon={query ? Search : Heart}
          title={query ? `Nothing in ${title} matches “${query}”` : "No songs here yet"}
          description={query ? "Try part of a title, an artist or an album." : "Songs you like, or add from their ⋯ menu, show up here."}
        />
      )}
    </div>
  );
}
