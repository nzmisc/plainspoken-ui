import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicSidebar, MusicTabBar } from "@/registry/plainspoken/blocks/music/nav";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** The sidebar on wide screens, with the playing playlist marked, and the tab bar phones get instead. */
export default function MusicNavDemo() {
  return (
    <MusicProvider initial={demoPlayback("night-drive", { playing: true })}>
      <div className="flex flex-wrap items-start gap-4">
        <MusicSidebar className="h-[440px] border" />
        <MusicTabBar className="w-80 border" />
      </div>
    </MusicProvider>
  );
}
