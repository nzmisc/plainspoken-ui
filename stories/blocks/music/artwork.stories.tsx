import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { ALBUMS, ARTISTS, initialsOf } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof Artwork> = {
  title: "Blocks/Music/Generated artwork",
  component: Artwork,
  args: { seed: "glasshouse-summer", title: "Glasshouse Summer", size: 200 },
};
export default meta;
type Story = StoryObj<typeof Artwork>;

/** One cover. Change the seed: the same seed always draws the same picture. */
export const Playground: Story = {};

/** Every album in the catalogue. */
export const Albums: Story = {
  render: () => (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
      {ALBUMS.map((a) => (
        <li key={a.id} className="text-[13px]">
          <Artwork seed={a.id} title={a.title} size="100%" className="border border-border" />
          {a.title}
        </li>
      ))}
    </ul>
  ),
};

/** Artists: their initials, big. */
export const Artists: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ARTISTS.map((a) => (
        <Artwork key={a.id} seed={a.id} initials={initialsOf(a.name)} label={a.name} size={96} />
      ))}
    </div>
  ),
};

/** Sizes from a sidebar's 16px to a header's 208px; below 64px the title is left off. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {[16, 32, 48, 64, 128, 208].map((s) => (
        <Artwork key={s} seed="night-bus-atlas" title="Night Bus Atlas" size={s} />
      ))}
    </div>
  ),
};
