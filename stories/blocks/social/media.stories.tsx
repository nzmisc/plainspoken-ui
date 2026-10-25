import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostImage, ProfileBanner } from "@/registry/plainspoken/blocks/social/media";

const meta: Meta<typeof PostImage> = {
  title: "Blocks/Social/Generated pictures",
  component: PostImage,
  args: { seed: "comet", alt: "A faint comet with a long pale tail over a dark hillside", ratio: 3 / 2 },
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof PostImage>;

/** One picture; change the seed for another. Hover ALT for the alt text. */
export const Playground: Story = {};

/** Many seeds: hills, skylines and seas in ten palettes. */
export const Many: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      {["loaf", "ciclovia", "geres", "vespa", "whale-hall", "timetable", "croissant", "goldfinch", "quay-street-map"].map((s) => (
        <PostImage key={s} seed={s} alt={s} ratio={1} />
      ))}
    </div>
  ),
};

/** Profile banners, 3 to 1. */
export const Banners: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {["ada", "grace", "robin"].map((h) => (
        <ProfileBanner key={h} seed={h} />
      ))}
    </div>
  ),
};
