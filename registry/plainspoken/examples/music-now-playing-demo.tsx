import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { NowPlayingView } from "@/registry/plainspoken/blocks/music/now-playing";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** The big player, as a phone shows it in a full-screen dialog (here in a box). */
export default function MusicNowPlayingDemo() {
  return (
    <MusicProvider initial={demoPlayback("rainy-day-indie", { track: 1, position: 131 })}>
      <div className="max-w-2xl border border-border p-3">
        <NowPlayingView />
      </div>
    </MusicProvider>
  );
}
