import Link from "next/link";
import type { ReactNode } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { PlayCollectionButton, type PlayContext } from "@/registry/plainspoken/blocks/music/player-provider";
import { APP_NAME, albumById, artistById, hrefFor, initialsOf, playlistById, popularTracks, year } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

const CARD_LINK = cn("flex min-w-0 flex-col gap-1.5 text-foreground no-underline visited:text-foreground", FOCUS_RING);

export interface MediaCardProps {
  href: string;
  /** Artwork seed: the item's id */
  seed: string;
  title: string;
  subtitle?: ReactNode;
  /** Draw these letters big instead of a pattern (artists) */
  initials?: string;
  /** Something else in the cover's place (a square of the same size) */
  cover?: ReactNode;
  /** Adds a play button over the cover, shown on hover and focus (always on touch screens) */
  play?: { context: PlayContext; trackIds: string[] };
  className?: string;
}

/**
 * A cover with a title and a line under it, linking to an album, a playlist or an artist. The play
 * button sits over the cover's corner, outside the link (so it is a button of its own, not a
 * button inside a link), and appears on hover or focus.
 */
export function MediaCard({ href, seed, title, subtitle, initials, cover, play, className }: MediaCardProps) {
  return (
    <div data-slot="music-media-card" className={cn("group @container relative min-w-0 p-1.5 hover:bg-secondary", className)}>
      <Link href={href} className={CARD_LINK}>
        {cover ?? <Artwork seed={seed} title={initials ? undefined : title} initials={initials} size="100%" className="border border-border" />}
        <span className="flex min-w-0 flex-col leading-snug">
          <span className="truncate font-semibold">{title}</span>
          {subtitle != null && <span className="line-clamp-2 text-[13px] text-muted-foreground">{subtitle}</span>}
        </span>
      </Link>
      {play && (
        // 100cqw is the cover's width: the button sits 8px inside its bottom-right corner
        <div className="absolute top-[calc(100cqw-38px)] right-3.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
          <PlayCollectionButton size="lg" context={play.context} trackIds={play.trackIds} className="border-background" />
        </div>
      )}
    </div>
  );
}

/** An album's card: cover, title, "2025 · Album" (or the artist's name, with `byArtist`) */
export function AlbumCard({ id, byArtist = false, className }: { id: string; byArtist?: boolean; className?: string }) {
  const a = albumById(id);
  if (!a) return null;
  return (
    <MediaCard
      href={hrefFor.album(id)}
      seed={id}
      title={a.title}
      subtitle={byArtist ? artistById(a.artistId).name : `${year(a)} · ${a.kind}`}
      play={{ context: { kind: "album", id, title: a.title, href: hrefFor.album(id) }, trackIds: a.trackIds }}
      className={className}
    />
  );
}

/** A playlist's card: cover, title, and its description or owner */
export function PlaylistCard({ id, className }: { id: string; className?: string }) {
  const p = playlistById(id);
  if (!p) return null;
  return (
    <MediaCard
      href={hrefFor.playlist(id)}
      seed={id}
      title={p.title}
      subtitle={p.owner === APP_NAME ? p.description : `By ${p.owner}`}
      play={{ context: { kind: "playlist", id, title: p.title, href: hrefFor.playlist(id) }, trackIds: p.entries.map((e) => e.trackId) }}
      className={className}
    />
  );
}

/** An artist's card: their initials as a picture, the name, "Artist" */
export function ArtistCard({ id, className }: { id: string; className?: string }) {
  const a = artistById(id);
  return (
    <MediaCard
      href={hrefFor.artist(id)}
      seed={id}
      initials={initialsOf(a.name)}
      title={a.name}
      subtitle="Artist"
      play={{ context: { kind: "artist", id, title: a.name, href: hrefFor.artist(id) }, trackIds: popularTracks(id).map((t) => t.id) }}
      className={className}
    />
  );
}

export interface ShelfProps {
  title: string;
  /** A line under the title */
  description?: string;
  /** "Show all" goes here */
  href?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A titled row of cards that scrolls sideways (with snap points) when there are more than fit:
 * "Made for you", "New releases". The row is a list, so screen readers hear how many there are.
 */
export function Shelf({ title, description, href, children, className }: ShelfProps) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex items-baseline gap-3 px-1.5">
        <h2 className="min-w-0 flex-1 text-[18px] font-bold">{title}</h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-[13px] font-semibold text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      {description && <p className="px-1.5 text-[13px] text-muted-foreground">{description}</p>}
      <ul className="mt-1 grid snap-x auto-cols-[minmax(140px,170px)] grid-flow-col overflow-x-auto pb-1 [&>li]:snap-start">{children}</ul>
    </section>
  );
}

/** Cards in a grid that fills the width: a library, a discography, search results */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))]", className)}>{children}</ul>;
}

export interface RecentTileProps {
  href: string;
  seed: string;
  title: string;
  play: { context: PlayContext; trackIds: string[] };
  initials?: string;
}

/**
 * A wide, short tile for the top of home: a small cover and a title, with a play button at the
 * right end on hover. Eight of them make "jump back in".
 */
export function RecentTile({ href, seed, title, play, initials }: RecentTileProps) {
  return (
    <div className="group relative flex items-center border border-border bg-muted hover:bg-accent">
      <Link
        href={href}
        className={cn("flex min-w-0 flex-1 items-center gap-2.5 pr-12 font-semibold text-foreground no-underline visited:text-foreground", FOCUS_RING)}
      >
        <Artwork seed={seed} initials={initials} size={48} />
        <span className="line-clamp-2 min-w-0 leading-tight break-words">{title}</span>
      </Link>
      <div className="absolute right-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <PlayCollectionButton size="md" context={play.context} trackIds={play.trackIds} />
      </div>
    </div>
  );
}

/** "Jump back in": recent albums, playlists and artists as wide tiles, two across in a narrow box and four in a wide one */
export function RecentGrid({ items, className }: { items: [kind: "album" | "playlist" | "artist", id: string][]; className?: string }) {
  return (
    // Four across once its own box is wide enough, wherever it is placed
    <div className={cn("@container", className)}>
      <ul className="grid grid-cols-2 gap-2 @3xl:grid-cols-4">
        {items.map(([kind, id]) => {
          if (kind === "artist") {
            const a = artistById(id);
            const ctx = { kind, id, title: a.name, href: hrefFor.artist(id) };
            return (
              <li key={id}>
                <RecentTile
                  href={ctx.href}
                  seed={id}
                  initials={initialsOf(a.name)}
                  title={a.name}
                  play={{ context: ctx, trackIds: popularTracks(id).map((t) => t.id) }}
                />
              </li>
            );
          }
          const album = kind === "album" ? albumById(id) : undefined;
          const pl = kind === "playlist" ? playlistById(id) : undefined;
          const title = album?.title ?? pl?.title;
          if (!title) return null;
          const href = kind === "album" ? hrefFor.album(id) : hrefFor.playlist(id);
          const ids = album ? album.trackIds : (pl?.entries.map((e) => e.trackId) ?? []);
          return (
            <li key={id}>
              <RecentTile href={href} seed={id} title={title} play={{ context: { kind, id, title, href }, trackIds: ids }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
