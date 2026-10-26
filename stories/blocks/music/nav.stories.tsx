import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicSidebar, MusicTabBar } from "@/registry/plainspoken/blocks/music/nav";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof MusicSidebar> = {
  title: "Blocks/Music/Music navigation",
  component: MusicSidebar,
  parameters: { nextjs: { navigation: { pathname: "/demos/music/playlist/night-drive" } } },
  decorators: [(S) => <MusicProvider initial={demoPlayback("night-drive", { playing: true })}>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof MusicSidebar>;

/** On the Night Drive playlist, which is playing (the sound-wave mark). */
export const Sidebar: Story = { args: { className: "h-[480px] border" } };

/** The phone's tab bar, on Search. */
export const TabBar: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/music/search" } } },
  render: () => <MusicTabBar className="w-80 border" />,
};
