import Link from "next/link";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { CollectionActions, CollectionHeader } from "@/registry/plainspoken/blocks/music/collection-header";
import { albumById, artistById, hrefFor, plural, totalLength, trackById, year } from "@/registry/plainspoken/blocks/music/data";

/** An album's header and its actions: play, shuffle, save to the library, and ⋯. */
export default function MusicCollectionHeaderDemo() {
  const a = albumById("velvet-hours")!;
  const artist = artistById(a.artistId);
  const length = a.trackIds.reduce((s, id) => s + (trackById(id)?.duration ?? 0), 0);
  return (
    <MusicProvider>
      <div className="border border-border">
        <CollectionHeader
          kind={a.kind}
          title={a.title}
          seed={a.id}
          meta={
            <>
              <Link href={hrefFor.artist(artist.id)} className="font-bold text-foreground no-underline visited:text-foreground hover:underline">
                {artist.name}
              </Link>
              <span className="text-muted-foreground">
                · {year(a)} · {plural(a.trackIds.length, "song")}, {totalLength(length)}
              </span>
            </>
          }
        />
        <CollectionActions
          context={{ kind: "album", id: a.id, title: a.title, href: hrefFor.album(a.id) }}
          trackIds={a.trackIds}
          save={{ kind: "albums", id: a.id }}
          artistId={artist.id}
        />
      </div>
    </MusicProvider>
  );
}
