import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { PlayerBar } from "@/registry/plainspoken/blocks/music/player-bar";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof PlayerBar> = {
  title: "Blocks/Music/Player bar",
  component: PlayerBar,
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <MusicProvider initial={demoPlayback("sunday-morning-coffee", { track: 2, position: 47 })}>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof PlayerBar>;

/** Paused part-way into a track. The queue button opens a drawer; ⤢ opens the big player. */
export const Paused: Story = {};

/** Playing. */
export const Playing: Story = {
  decorators: [(S) => <MusicProvider initial={demoPlayback("night-drive", { playing: true })}>{S()}</MusicProvider>],
};

/** Nothing loaded yet. */
export const Empty: Story = { decorators: [(S) => <MusicProvider>{S()}</MusicProvider>] };

/** On a phone: the mini player. Tap the title for the big player. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
