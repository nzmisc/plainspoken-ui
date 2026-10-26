"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BadgeCheck, CircleCheck, CirclePlus, Ellipsis, Link2, ListEnd, MicVocal, Shuffle, UserCheck, UserPlus } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { PlayCollectionButton, useLibrary, usePlayer, type PlayContext, type SavedKind } from "@/registry/plainspoken/blocks/music/player-provider";
import { APP_NAME, YOU, hrefFor, playlistById, plural, totalLength, trackById } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

export interface CollectionHeaderProps {
  /** Small line over the title: "Album", "Public playlist", "Artist" */
  kind: string;
  title: string;
  description?: ReactNode;
  /** Artwork seed (the item's id); or `cover` for something else in its place */
  seed?: string;
  cover?: ReactNode;
  /** Letters instead of a pattern (artists) */
  initials?: string;
  /** The line under the title: owner, year, counts, length */
  meta?: ReactNode;
  verified?: boolean;
  className?: string;
}

/**
 * The top of an album, playlist or artist page: a big cover, what kind of thing it is, the title
 * as the page's h1, a description, and a line of facts (who made it, when, how many songs, how
 * long). Side by side on wide screens, stacked on phones.
 */
export function CollectionHeader({ kind, title, description, seed, cover, initials, meta, verified, className }: CollectionHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 border-b border-border bg-muted px-3 py-4 sm:flex-row sm:items-end md:px-5 md:py-5", className)}>
      {cover ??
        (seed && (
          <Artwork
            seed={seed}
            title={initials ? undefined : title}
            initials={initials}
            size="100%"
            className="w-40 border border-border max-sm:mx-auto sm:w-44 lg:w-52"
          />
        ))}
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="flex items-center gap-1 text-[13px] font-semibold">
          {verified && <Icon icon={BadgeCheck} />}
          {verified ? `Verified ${kind.toLowerCase()}` : kind}
        </p>
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight text-balance md:text-[36px]">{title}</h1>
        {description && <p className="max-w-[70ch] text-muted-foreground">{description}</p>}
        {meta && <p className="flex flex-wrap items-center gap-x-1.5 text-[13px]">{meta}</p>}
      </div>
    </header>
  );
}

/** "Robin Achterberg · 12 saves · 24 songs, about 1 hr 30 min", counting this session's edits */
export function PlaylistMeta({ playlistId, owner, followers }: { playlistId: string; owner: string; followers?: number }) {
  const lib = useLibrary();
  const entries = lib.entriesOf(playlistId);
  const length = entries.reduce((s, e) => s + (trackById(e.trackId)?.duration ?? 0), 0);
  return (
    <>
      <b>{owner}</b>
      {followers ? <span className="text-muted-foreground">· {plural(followers, "save")}</span> : null}
      <span className="text-muted-foreground">
        · {plural(entries.length, "song")}
        {entries.length > 0 && `, ${totalLength(length)}`}
      </span>
    </>
  );
}

export interface CollectionActionsProps {
  context: PlayContext;
  /** The tracks to play; for playlists leave out and give `playlistId`, so edits count */
  trackIds?: string[];
  playlistId?: string;
  /** What the save button saves: an album or playlist to the library, or an artist to follow */
  save?: { kind: SavedKind; id: string };
  /** Adds "Go to artist" to the ⋯ menu */
  artistId?: string;
  className?: string;
}

/**
 * The row of actions under a collection's header: a big play button, shuffle, save to the library
 * (or follow, for an artist) and a ⋯ menu with "Add to queue", "Go to artist" and "Copy link".
 */
export function CollectionActions({ context, trackIds, playlistId, save, artistId, className }: CollectionActionsProps) {
  const p = usePlayer();
  const lib = useLibrary();
  const router = useRouter();
  const ids = trackIds ?? (playlistId ? lib.entriesOf(playlistId).map((e) => e.trackId) : []);
  const saved = save ? lib.isSaved(save.kind, save.id) : false;
  const own = playlistId != null && playlistId !== "liked";
  const items: MenuItem[] = [
    { label: "Add to queue", icon: ListEnd, onSelect: () => ids.forEach((id) => p.addToQueue(id)), disabled: !ids.length },
    ...(artistId ? [{ label: "Go to artist", icon: MicVocal, onSelect: () => router.push(hrefFor.artist(artistId)) }] : []),
    {
      label: "Copy link",
      icon: Link2,
      onSelect: () => {
        const href = context.href ?? location.pathname;
        navigator.clipboard?.writeText(`${location.origin}${href}`).then(
          () => toast({ title: "Link copied", description: context.title }),
          () => toast({ title: "Couldn't copy the link", variant: "warning" }),
        );
      },
    },
  ];
  return (
    <div className={cn("flex items-center gap-2 px-3 py-3 md:px-5", className)}>
      <PlayCollectionButton size="lg" context={context} trackIds={ids} className="size-11 [&_svg]:size-5" />
      <Toggle
        variant="ghost"
        size="lg"
        icon={Shuffle}
        label="Shuffle"
        pressed={p.shuffle}
        onPressedChange={() => {
          // Shuffle on and nothing from here playing yet: start this collection, shuffled
          if (!p.shuffle && !p.isContext(context.kind, context.id) && ids.length) {
            p.toggleShuffle();
            p.playContext(context, ids, ids[Math.floor(Math.random() * ids.length)]);
          } else p.toggleShuffle();
        }}
      />
      {save &&
        (save.kind === "artists" ? (
          <Button
            variant={saved ? "default" : "outline"}
            icon={saved ? UserCheck : UserPlus}
            aria-pressed={saved}
            onClick={() => lib.toggleSaved(save.kind, save.id, context.title)}
          >
            {saved ? "Following" : "Follow"}
          </Button>
        ) : !own || playlistById(save.id)?.owner !== YOU.name ? (
          <Toggle
            variant="ghost"
            size="lg"
            label={save.kind === "albums" ? "Save to Your Library" : "Save playlist to Your Library"}
            pressed={saved}
            onPressedChange={() => lib.toggleSaved(save.kind, save.id, context.title)}
            icon={CirclePlus}
            iconPressed={CircleCheck}
            className="aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:hover:bg-secondary"
          />
        ) : null)}
      <DropdownMenu trigger={Ellipsis} label={`More options for ${context.title}`} triggerVariant="ghost" size="lg" items={items} />
      {own && playlistById(playlistId)?.owner === APP_NAME && (
        <span className="ml-auto text-[13px] text-muted-foreground max-sm:hidden">
          Made for <b className="text-foreground">{YOU.name}</b>
        </span>
      )}
      {artistId && context.kind === "album" && (
        <Link
          href={hrefFor.artist(artistId)}
          className="ml-auto text-[13px] font-semibold text-muted-foreground no-underline visited:text-muted-foreground hover:text-foreground hover:underline max-sm:hidden"
        >
          More by this artist
        </Link>
      )}
    </div>
  );
}
