import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { RecentGrid } from "@/registry/plainspoken/blocks/music/media-card";
import { RECENTLY_PLAYED } from "@/registry/plainspoken/blocks/music/data";

/** The wide tiles at the top of home: two across on phones, four on wide screens. */
export default function MusicMediaCardRecent() {
  return (
    <MusicProvider>
      <RecentGrid items={RECENTLY_PLAYED} />
    </MusicProvider>
  );
}
