import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicLibrary } from "@/registry/plainspoken/blocks/music/library";

/** The library as a list. Filter with the chips, change the sort, or switch to the grid. */
export default function MusicLibraryDemo() {
  return (
    <MusicProvider>
      <div className="max-h-[560px] overflow-y-auto border border-border">
        <MusicLibrary />
      </div>
    </MusicProvider>
  );
}
