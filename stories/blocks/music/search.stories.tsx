import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicSearch } from "@/registry/plainspoken/blocks/music/search";

const meta: Meta<typeof MusicSearch> = {
  title: "Blocks/Music/Music search",
  component: MusicSearch,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/music/search" } } },
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
};
export default meta;
type Story = StoryObj<typeof MusicSearch>;

/** Browse all: genre and mood tiles. Type to search. */
export const Browse: Story = {};

/** Results for "night": top result, songs, then albums and playlists. Chips show one group in full. */
export const Results: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/music/search", query: { q: "night" } } } } };

/** A genre's page. */
export const Genre: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/music/search", query: { genre: "jazz" } } } } };

/** Nothing found. */
export const NoResults: Story = { parameters: { nextjs: { navigation: { pathname: "/demos/music/search", query: { q: "polka" } } } } };
