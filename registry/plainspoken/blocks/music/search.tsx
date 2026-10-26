"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { AlbumCard, ArtistCard, CardGrid, PlaylistCard, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { PlayCollectionButton } from "@/registry/plainspoken/blocks/music/player-provider";
import { TrackTable } from "@/registry/plainspoken/blocks/music/track-table";
import {
  ALBUMS,
  ARTISTS,
  GENRES,
  PLAYLISTS,
  TRACKS,
  artistById,
  artistNames,
  hrefFor,
  initialsOf,
  popularTracks,
  type Genre,
} from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

/** Lower case, accents off: "Ramírez" matches "ramirez" */
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** 2 for a match at the start of a word, 1 anywhere, 0 for none */
function score(text: string, q: string): number {
  const t = fold(text);
  if (!t.includes(q)) return 0;
  return t.startsWith(q) || t.includes(` ${q}`) ? 2 : 1;
}

function rank<T>(items: T[], text: (x: T) => string, q: string): T[] {
  return items
    .map((x) => ({ x, s: score(text(x), q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.x);
}

/** Everything that matches a query, grouped */
export function searchCatalogue(query: string) {
  const q = fold(query.trim());
  if (!q) return null;
  const artists = rank(ARTISTS, (a) => a.name, q);
  const albums = rank(ALBUMS, (a) => `${a.title} ${artistById(a.artistId).name}`, q);
  const playlists = rank(PLAYLISTS, (p) => `${p.title} ${p.description}`, q);
  const songs = rank(TRACKS, (t) => `${t.title} ${artistNames(t)}`, q).sort((a, b) => score(b.title, q) - score(a.title, q) || b.plays - a.plays);
  return { artists, albums, playlists, songs };
}

/**
 * A browse tile: a genre or mood in a coloured box, its name in big type and a piece of cover art
 * tipped into the corner. Links to that genre's page of the search.
 */
export function GenreTile({ genre, href }: { genre: Genre; href: string }) {
  return (
    <Link
      href={href}
      className={cn("relative block aspect-[16/10] overflow-hidden border border-border text-foreground no-underline visited:text-foreground", FOCUS_RING)}
    >
      <Artwork seed={genre.seed} size="100%" className="absolute inset-0 h-full w-full scale-150" />
      <span className="absolute top-2 left-2 border border-border bg-background/90 px-1.5 py-0.5 text-[15px] leading-tight font-bold">{genre.name}</span>
      <Artwork seed={`${genre.seed}-corner`} size={72} className="absolute -right-3 -bottom-2 rotate-[24deg] border border-border" />
    </Link>
  );
}

type Group = "all" | "songs" | "artists" | "albums" | "playlists";
const GROUPS: [Group, string][] = [
  ["all", "All"],
  ["songs", "Songs"],
  ["artists", "Artists"],
  ["albums", "Albums"],
  ["playlists", "Playlists"],
];

function TopResult({ r }: { r: NonNullable<ReturnType<typeof searchCatalogue>> }) {
  const artist = r.artists[0];
  const album = !artist ? r.albums[0] : undefined;
  const song = !artist && !album ? r.songs[0] : undefined;
  const item = artist
    ? {
        href: hrefFor.artist(artist.id),
        seed: artist.id,
        initials: initialsOf(artist.name),
        title: artist.name,
        kind: "Artist",
        ids: popularTracks(artist.id).map((t) => t.id),
        ctx: { kind: "artist" as const, id: artist.id, title: artist.name, href: hrefFor.artist(artist.id) },
      }
    : album
      ? {
          href: hrefFor.album(album.id),
          seed: album.id,
          title: album.title,
          kind: `${album.kind} · ${artistById(album.artistId).name}`,
          ids: album.trackIds,
          ctx: { kind: "album" as const, id: album.id, title: album.title, href: hrefFor.album(album.id) },
        }
      : song
        ? {
            href: hrefFor.album(song.albumId),
            seed: song.albumId,
            title: song.title,
            kind: `Song · ${artistNames(song)}`,
            ids: [song.id],
            ctx: { kind: "search" as const, id: song.id, title: song.title },
          }
        : null;
  if (!item) return null;
  return (
    <section aria-labelledby="top-result" className="flex min-w-0 flex-col gap-1">
      <h2 id="top-result" className="text-[18px] font-bold">
        Top result
      </h2>
      <div className="group relative flex flex-col gap-3 border border-border bg-muted p-4 hover:bg-accent">
        <Artwork seed={item.seed} initials={item.initials} size={96} className="border border-border" />
        <Link
          href={item.href}
          className={cn("text-[24px] leading-tight font-bold text-foreground no-underline visited:text-foreground hover:underline", FOCUS_RING)}
        >
          {item.title}
        </Link>
        <p className="text-[13px] text-muted-foreground">{item.kind}</p>
        <div className="absolute right-4 bottom-4">
          <PlayCollectionButton size="lg" context={item.ctx} trackIds={item.ids} />
        </div>
      </div>
    </section>
  );
}

/**
 * The search page: a big search box, then either the browse tiles (genres and moods), one genre's
 * artists, albums and playlists, or the results for what was typed, grouped into a top result,
 * songs, artists, albums and playlists, with chips to show one group in full. The query and the
 * genre live in the URL (?q=, ?genre=), so Back and shared links work. Needs a <Suspense> around
 * it (it reads the search params).
 */
export function MusicSearch() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [group, setGroup] = useState<Group>("all");
  const genre = GENRES.find((g) => g.id === params.get("genre"));
  const results = useMemo(() => searchCatalogue(query), [query]);

  const update = (q: string) => {
    setQuery(q);
    setGroup("all");
    // Keep it in the address without a navigation per keystroke
    const url = new URL(location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    url.searchParams.delete("genre");
    history.replaceState(history.state, "", url);
  };

  const count = results ? results.songs.length + results.artists.length + results.albums.length + results.playlists.length : 0;

  return (
    <div className="flex flex-col gap-5 px-1.5 py-4 md:px-3.5">
      <div className="px-1.5">
        <h1 className="sr-only">Search</h1>
        <Input
          type="search"
          size="lg"
          prefix={Search}
          placeholder="What do you want to listen to?"
          aria-label="Search songs, artists, albums and playlists"
          value={query}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && query && (e.preventDefault(), update(""))}
          suffix={query ? <IconButton size="sm" variant="ghost" icon={X} label="Clear search" onClick={() => update("")} /> : undefined}
          className="w-full max-w-xl"
          autoFocus
        />
        <p aria-live="polite" className="sr-only">
          {results ? (count ? `${count} results` : "No results") : ""}
        </p>
      </div>

      {results ? (
        count === 0 ? (
          <EmptyState
            icon={Search}
            title={`Nothing found for “${query}”`}
            description="Check the spelling, or try fewer or different words: an artist, a song, an album."
          />
        ) : (
          <>
            <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5 px-1.5">
              {GROUPS.map(([g, label]) => (
                <Chip key={g} pressed={group === g} onPressedChange={() => setGroup(g)}>
                  {label}
                </Chip>
              ))}
            </div>
            {group === "all" && (
              <div className="grid gap-5 px-1.5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <TopResult r={results} />
                {results.songs.length > 0 && (
                  <section aria-labelledby="songs" className="flex min-w-0 flex-col gap-1">
                    <h2 id="songs" className="text-[18px] font-bold">
                      Songs
                    </h2>
                    <TrackTable
                      entries={results.songs.slice(0, 4).map((t) => ({ trackId: t.id }))}
                      context={{ kind: "search", id: query, title: `Search: ${query}`, href: `${pathname}?q=${encodeURIComponent(query)}` }}
                      columns={{ artwork: true }}
                      label="Songs"
                    />
                  </section>
                )}
              </div>
            )}
            {group === "songs" && (
              <TrackTable
                entries={results.songs.slice(0, 50).map((t) => ({ trackId: t.id }))}
                context={{ kind: "search", id: query, title: `Search: ${query}`, href: `${pathname}?q=${encodeURIComponent(query)}` }}
                columns={{ artwork: true, album: true }}
                label={`Songs matching ${query}`}
              />
            )}
            {(["artists", "albums", "playlists"] as const).map((k) => {
              const list = results[k];
              if (!list.length || (group !== "all" && group !== k)) return null;
              const card = (id: string) =>
                k === "artists" ? <ArtistCard id={id} /> : k === "albums" ? <AlbumCard id={id} byArtist /> : <PlaylistCard id={id} />;
              const title = k[0].toUpperCase() + k.slice(1);
              return group === "all" ? (
                <Shelf key={k} title={title}>
                  {list.slice(0, 8).map((x) => (
                    <li key={x.id}>{card(x.id)}</li>
                  ))}
                </Shelf>
              ) : (
                <CardGrid key={k}>
                  {list.map((x) => (
                    <li key={x.id}>{card(x.id)}</li>
                  ))}
                </CardGrid>
              );
            })}
          </>
        )
      ) : genre ? (
        <GenrePage genre={genre} />
      ) : (
        <section aria-labelledby="browse" className="flex flex-col gap-2 px-1.5">
          <h2 id="browse" className="text-[18px] font-bold">
            Browse all
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {GENRES.map((g) => (
              <li key={g.id}>
                <GenreTile genre={g} href={`${pathname}?genre=${g.id}`} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function GenrePage({ genre }: { genre: Genre }) {
  const pathname = usePathname();
  const artists = ARTISTS.filter((a) => a.genres.includes(genre.id));
  const albums = ALBUMS.filter((a) => artistById(a.artistId).genres.includes(genre.id)).sort((a, b) => b.released.localeCompare(a.released));
  const playlists = PLAYLISTS.filter((p) => p.tags.includes(genre.id));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 px-1.5">
        <Link
          href={pathname}
          className={cn(
            "inline-flex items-center gap-1 text-[13px] text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground",
            FOCUS_RING,
          )}
        >
          <Icon icon={ArrowLeft} />
          Browse all
        </Link>
      </div>
      <h2 className="px-1.5 text-[28px] font-bold">{genre.name}</h2>
      {playlists.length > 0 && (
        <Shelf title={`${genre.name} playlists`}>
          {playlists.map((p) => (
            <li key={p.id}>
              <PlaylistCard id={p.id} />
            </li>
          ))}
        </Shelf>
      )}
      {artists.length > 0 && (
        <Shelf title="Artists">
          {artists.map((a) => (
            <li key={a.id}>
              <ArtistCard id={a.id} />
            </li>
          ))}
        </Shelf>
      )}
      {albums.length > 0 && (
        <Shelf title="Albums and singles">
          {albums.map((a) => (
            <li key={a.id}>
              <AlbumCard id={a.id} byArtist />
            </li>
          ))}
        </Shelf>
      )}
      {!playlists.length && !artists.length && !albums.length && <EmptyState title={`Nothing in ${genre.name} yet`} />}
    </div>
  );
}
