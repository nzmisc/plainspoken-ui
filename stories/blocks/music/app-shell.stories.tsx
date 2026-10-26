import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicApp } from "@/registry/plainspoken/blocks/music/app-shell";
import { MusicLibrary } from "@/registry/plainspoken/blocks/music/library";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof MusicApp> = {
  title: "Blocks/Music/Music app frame",
  component: MusicApp,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/music/library" } } },
  args: { initial: demoPlayback("night-drive"), className: "h-dvh", children: <MusicLibrary /> },
};
export default meta;
type Story = StoryObj<typeof MusicApp>;

/** The frame around Your Library. Press ? for the keyboard shortcuts. */
export const Frame: Story = {};

/** On a phone: tab bar and mini player. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
