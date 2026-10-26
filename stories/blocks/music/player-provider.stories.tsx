import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LikeButton, MusicProvider, PlayCollectionButton, usePlayer, usePosition } from "@/registry/plainspoken/blocks/music/player-provider";
import { albumById, artistNames, clock, demoPlayback, hrefFor } from "@/registry/plainspoken/blocks/music/data";

function State() {
  const p = usePlayer();
  const position = usePosition();
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-[13px]">
      <dt className="text-muted-foreground">Track</dt>
      <dd>{p.track ? `${p.track.title} by ${artistNames(p.track)}` : "none"}</dd>
      <dt className="text-muted-foreground">Position</dt>
      <dd className="tabular-nums">{clock(position)}</dd>
      <dt className="text-muted-foreground">State</dt>
      <dd>{p.playing ? "playing" : "paused"}</dd>
      <dt className="text-muted-foreground">From</dt>
      <dd>{p.context?.title ?? "nothing"}</dd>
    </dl>
  );
}

function Demo() {
  const a = albumById("tidewater")!;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PlayCollectionButton size="lg" context={{ kind: "album", id: a.id, title: a.title, href: hrefFor.album(a.id) }} trackIds={a.trackIds} />
        <LikeButton trackId={a.trackIds[0]} />
        <span className="text-[13px] text-muted-foreground">Play Tidewater; like its first track.</span>
      </div>
      <State />
    </div>
  );
}

/**
 * The player's state, the clock and the library live in MusicProvider. The keyboard shortcuts
 * (usePlayerShortcuts) are switched on by the app frame, not here.
 */
const meta: Meta<typeof MusicProvider> = {
  title: "Blocks/Music/Player state",
  component: MusicProvider,
};
export default meta;
type Story = StoryObj<typeof MusicProvider>;

/** Nothing loaded: press play. */
export const Empty: Story = {
  render: () => (
    <MusicProvider>
      <Demo />
    </MusicProvider>
  ),
};

/** Started with a playlist loaded, playing. */
export const Playing: Story = {
  render: () => (
    <MusicProvider initial={demoPlayback("night-drive", { playing: true })}>
      <Demo />
    </MusicProvider>
  ),
};
