import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { SeekBar, Transport, VolumeControl } from "@/registry/plainspoken/blocks/music/player-controls";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** The transport, the seek bar and the volume, small as in the player bar and large as in the big player. */
export default function MusicPlayerControlsDemo() {
  return (
    <MusicProvider initial={demoPlayback("night-drive")}>
      <div className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col">
          <Transport size="sm" />
          <SeekBar size="xs" />
        </div>
        <div className="flex flex-col gap-2">
          <SeekBar stacked size="md" />
          <Transport size="lg" className="gap-3" />
        </div>
        <VolumeControl className="max-w-60" />
      </div>
    </MusicProvider>
  );
}
