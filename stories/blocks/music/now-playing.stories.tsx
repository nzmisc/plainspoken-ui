import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { NowPlayingDialog, NowPlayingView } from "@/registry/plainspoken/blocks/music/now-playing";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof NowPlayingView> = {
  title: "Blocks/Music/Now playing",
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  component: NowPlayingView,
  decorators: [(S) => <MusicProvider initial={demoPlayback("rainy-day-indie", { track: 1, position: 131 })}>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof NowPlayingView>;

/** The view on its own. */
export const View: Story = { decorators: [(S) => <div className="max-w-2xl border border-border p-3">{S()}</div>] };

/** In its dialog. */
export const Dialog: Story = { render: () => <NowPlayingDialog open onClose={() => {}} /> };

/** On a phone, where it fills the screen. */
export const Phone: Story = { render: () => <NowPlayingDialog open onClose={() => {}} />, globals: { viewport: { value: "iphoneSE", isRotated: false } } };

/** Nothing loaded. */
export const Empty: Story = { decorators: [(S) => <MusicProvider>{S()}</MusicProvider>] };
