import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { SeekBar, Transport, VolumeControl } from "@/registry/plainspoken/blocks/music/player-controls";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof Transport> = {
  title: "Blocks/Music/Player controls",
  component: Transport,
  decorators: [(S) => <MusicProvider initial={demoPlayback("night-drive")}>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof Transport>;

/** Shuffle and repeat are toggles; repeat cycles off, all, one. */
export const Playground: Story = { args: { size: "sm" } };

/** Every size of the transport. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((s) => (
        <Transport key={s} size={s} />
      ))}
    </div>
  ),
};

/** The seek bar beside its times (the bar) and stacked (the big player); then volume. Drag the seek thumb: playback carries on underneath. */
export const SeekAndVolume: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      <SeekBar size="xs" />
      <SeekBar stacked size="md" />
      <VolumeControl className="max-w-60" />
    </div>
  ),
};

/** With nothing loaded everything is disabled. */
export const Disabled: Story = {
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
  render: () => (
    <div className="flex max-w-lg flex-col">
      <Transport size="sm" />
      <SeekBar size="xs" />
    </div>
  ),
};
