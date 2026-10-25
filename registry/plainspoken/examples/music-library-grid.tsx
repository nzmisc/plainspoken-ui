import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicLibrary } from "@/registry/plainspoken/blocks/music/library";

/** The same library as a grid of covers. */
export default function MusicLibraryGrid() {
  return (
    <MusicProvider>
      <div className="max-h-[560px] overflow-y-auto border border-border">
        <MusicLibrary defaultView="grid" />
      </div>
    </MusicProvider>
  );
}
