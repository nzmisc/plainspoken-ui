"use client";

import { useState } from "react";
import { MapPin } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { AlbumCard, CardGrid } from "@/registry/plainspoken/blocks/music/media-card";
import { TrackTable } from "@/registry/plainspoken/blocks/music/track-table";
import { artistById, hrefFor, monthlyListeners, popularTracks, releasesBy, type AlbumKind } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

/**
 * An artist's most played tracks (including ones they are featured on), with play counts: five,
 * and "See more" for ten. Plays as the artist's context, so the queue says "Next from: Halvard".
 */
export function PopularTracks({ artistId, className }: { artistId: string; className?: string }) {
  const [more, setMore] = useState(false);
  const a = artistById(artistId);
  const top = popularTracks(artistId, 10);
  const shown = more ? top : top.slice(0, 5);
  return (
    <section aria-labelledby={`popular-${artistId}`} className={cn("flex flex-col gap-1", className)}>
      <h2 id={`popular-${artistId}`} className="px-3 text-[18px] font-bold md:px-5">
        Popular
      </h2>
      <TrackTable
        entries={shown.map((t) => ({ trackId: t.id }))}
        context={{ kind: "artist", id: artistId, title: a.name, href: hrefFor.artist(artistId) }}
        columns={{ artwork: true, plays: true, artists: false }}
        label={`${a.name}: popular tracks`}
      />
      <Button variant="ghost" size="sm" aria-expanded={more} onClick={() => setMore(!more)} className="mx-2 self-start text-muted-foreground md:mx-4">
        {more ? "Show less" : "See more"}
      </Button>
    </section>
  );
}

type Filter = "popular" | "albums" | "singles";

/**
 * The artist's releases as cards, filtered with chips: popular releases (the newest few), albums,
 * or singles and EPs. One choice at a time, like radio buttons drawn as chips.
 */
export function Discography({ artistId, className }: { artistId: string; className?: string }) {
  const all = releasesBy(artistId);
  const [filter, setFilter] = useState<Filter>("popular");
  const kinds: Record<Filter, AlbumKind[]> = { popular: ["Album", "EP", "Single"], albums: ["Album"], singles: ["EP", "Single"] };
  const shown = all.filter((r) => kinds[filter].includes(r.kind)).slice(0, filter === "popular" ? 6 : undefined);
  const chips: [Filter, string][] = [
    ["popular", "Popular releases"],
    ["albums", "Albums"],
    ["singles", "Singles and EPs"],
  ];
  return (
    <section aria-labelledby={`discography-${artistId}`} className={cn("flex flex-col gap-2 px-1.5 md:px-3.5", className)}>
      <h2 id={`discography-${artistId}`} className="px-1.5 text-[18px] font-bold">
        Discography
      </h2>
      <div role="group" aria-label="Show" className="ctl-sm flex flex-wrap gap-1.5 px-1.5">
        {chips.map(([k, label]) => (
          <Chip key={k} pressed={filter === k} onPressedChange={() => setFilter(k)} size="sm">
            {label}
          </Chip>
        ))}
      </div>
      {shown.length ? (
        <CardGrid>
          {shown.map((r) => (
            <li key={r.id}>
              <AlbumCard id={r.id} />
            </li>
          ))}
        </CardGrid>
      ) : (
        <p className="px-1.5 text-muted-foreground">No {filter === "albums" ? "albums" : "singles or EPs"} yet.</p>
      )}
    </section>
  );
}

/** The artist's story: a short bio, where they're from, and how many people listen each month */
export function ArtistAbout({ artistId, className }: { artistId: string; className?: string }) {
  const a = artistById(artistId);
  return (
    <section aria-labelledby={`about-${artistId}`} className={cn("px-3 md:px-5", className)}>
      <h2 id={`about-${artistId}`} className="text-[18px] font-bold">
        About
      </h2>
      <div className="mt-2 flex max-w-3xl flex-col gap-2 border border-border bg-muted p-3">
        <p className="text-[15px] font-semibold">{monthlyListeners(a.monthlyListeners)}</p>
        <p className="max-w-[70ch]">{a.bio}</p>
        <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <Icon icon={MapPin} />
          {a.city}
        </p>
      </div>
    </section>
  );
}
