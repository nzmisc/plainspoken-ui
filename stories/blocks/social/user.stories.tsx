import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FollowButton, ProfileSummary, UserName, WhoToFollow } from "@/registry/plainspoken/blocks/social/user";

const meta: Meta<typeof WhoToFollow> = {
  title: "Blocks/Social/People",
  component: WhoToFollow,
  args: { handles: ["grace", "aiko", "linnea"], bio: false, moreHref: "#", className: "max-w-sm" },
};
export default meta;
type Story = StoryObj<typeof WhoToFollow>;

/** Who to follow. Hover a name for the profile card. */
export const Playground: Story = {};

/** With bios, as on Explore. */
export const WithBios: Story = { args: { bio: true, handles: ["felix", "sofia", "jules", "ben"] } };

/** A name with its hover card open from the start. */
export const HoverCardOpen: Story = {
  render: () => (
    <p className="min-h-72">
      Posted by <UserName handle="priya" />, who follows you.
    </p>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLAnchorElement>("a")?.focus();
  },
};

/** The card's body on its own. */
export const Summary: Story = { render: () => <div className="w-80 border border-border">{<ProfileSummary handle="samir" />}</div> };

/** Follow (not following yet), and Following. */
export const FollowButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <FollowButton handle="grace" />
      <FollowButton handle="ada" />
      <FollowButton handle="grace" size="md" />
    </div>
  ),
};
