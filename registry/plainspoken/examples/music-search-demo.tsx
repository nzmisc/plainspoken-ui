import { Suspense } from "react";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicSearch } from "@/registry/plainspoken/blocks/music/search";

/** Browse tiles until you type; then results grouped into a top result, songs, artists, albums and playlists. Try "night" or "ramirez". */
export default function MusicSearchDemo() {
  return (
    <MusicProvider>
      <div className="max-h-[560px] overflow-y-auto border border-border">
        <Suspense>
          <MusicSearch />
        </Suspense>
      </div>
    </MusicProvider>
  );
}
