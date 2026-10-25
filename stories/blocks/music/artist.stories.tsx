import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { ArtistAbout, Discography, PopularTracks } from "@/registry/plainspoken/blocks/music/artist";

const meta: Meta<typeof PopularTracks> = {
  title: "Blocks/Music/Artist sections",
  component: PopularTracks,
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
  args: { artistId: "juniper-vale" },
};
export default meta;
type Story = StoryObj<typeof PopularTracks>;

/** Popular tracks; "See more" shows ten. */
export const Popular: Story = {};

/** The discography: chips choose popular releases, albums, or singles and EPs. */
export const DiscographyChips: Story = { render: () => <Discography artistId="marigold-static" /> };

/** An artist with only albums: "Singles and EPs" says there are none. */
export const NoSingles: Story = { render: () => <Discography artistId="the-grey-herons" /> };

/** About. */
export const About: Story = { render: () => <ArtistAbout artistId="kestrel-and-finch" /> };
