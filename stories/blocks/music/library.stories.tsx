import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicLibrary } from "@/registry/plainspoken/blocks/music/library";

const meta: Meta<typeof MusicLibrary> = {
  title: "Blocks/Music/Your Library",
  component: MusicLibrary,
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof MusicLibrary>;

/** As a list, most recently played first. */
export const List: Story = {};

/** As a grid of covers. */
export const Grid: Story = { args: { defaultView: "grid" } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
