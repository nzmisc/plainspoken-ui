import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { QueueList } from "@/registry/plainspoken/blocks/music/queue";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** Now playing, two songs added with "Add to queue", then the rest of the playlist. Choose a row to play it. */
export default function MusicQueueDemo() {
  return (
    <MusicProvider initial={demoPlayback("deep-focus", { track: 0, upNext: ["brighter--brighter", "kingsway-nights--kingsway-nights"] })}>
      <div className="max-h-96 max-w-sm overflow-y-auto border border-border">
        <QueueList limit={6} />
      </div>
    </MusicProvider>
  );
}
