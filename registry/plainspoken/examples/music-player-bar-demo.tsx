import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { PlayerBar } from "@/registry/plainspoken/blocks/music/player-bar";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** The bar with a track loaded. Narrow the window below 768px for the phone's mini player. The queue and big player open from it. */
export default function MusicPlayerBarDemo() {
  return (
    <MusicProvider initial={demoPlayback("sunday-morning-coffee", { track: 2, position: 47 })}>
      <PlayerBar className="border-x border-b" />
    </MusicProvider>
  );
}
