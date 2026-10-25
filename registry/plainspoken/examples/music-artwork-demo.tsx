import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { ALBUMS, initialsOf } from "@/registry/plainspoken/blocks/music/data";

/** Covers drawn from each album's id: the pattern and the palette come from the seed, so every album keeps its own. */
export default function MusicArtworkDemo() {
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
        {ALBUMS.slice(0, 12).map((a) => (
          <li key={a.id}>
            <Artwork seed={a.id} title={a.title} label={`${a.title} cover`} size="100%" className="border border-border" />
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-2">
        <Artwork seed="halvard" initials={initialsOf("Halvard")} label="Halvard" size={64} />
        <Artwork seed="nadia-okafor" initials={initialsOf("Nadia Okafor")} label="Nadia Okafor" size={48} />
        <Artwork seed="night-drive" size={32} />
        <Artwork seed="deep-focus" size={16} />
        <span className="text-[13px] text-muted-foreground">Artists get their initials; small sizes drop the title.</span>
      </div>
    </div>
  );
}
