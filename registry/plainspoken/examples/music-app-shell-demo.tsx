import { MusicApp } from "@/registry/plainspoken/blocks/music/app-shell";
import { AlbumCard, RecentGrid, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { ALBUMS, RECENTLY_PLAYED, demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** The whole frame in a 620px box: sidebar, page and player bar (a tab bar too, on phones). Press ? for the keys. */
export default function MusicAppShellDemo() {
  return (
    <MusicApp initial={demoPlayback("night-drive")} className="h-[620px] border border-border">
      <div className="flex flex-col gap-5 px-1.5 py-4 md:px-3.5">
        <h1 className="px-1.5 text-[24px] font-bold">Good evening</h1>
        <RecentGrid items={RECENTLY_PLAYED} className="px-1.5" />
        <Shelf title="New releases">
          {ALBUMS.slice(0, 8).map((a) => (
            <li key={a.id}>
              <AlbumCard id={a.id} byArtist />
            </li>
          ))}
        </Shelf>
      </div>
    </MusicApp>
  );
}
