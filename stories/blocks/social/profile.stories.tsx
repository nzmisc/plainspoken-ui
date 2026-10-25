import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileHeader, ProfileTabs } from "@/registry/plainspoken/blocks/social/profile";

const meta: Meta<typeof ProfileHeader> = {
  title: "Blocks/Social/Profile",
  component: ProfileHeader,
  decorators: [(S) => <div className="max-w-[600px] border-x border-border">{S()}</div>],
  args: { handle: "grace" },
};
export default meta;
type Story = StoryObj<typeof ProfileHeader>;

/** Someone you don't follow (verified). */
export const Someone: Story = {};

/** Someone who follows you, and you them. */
export const Mutual: Story = { args: { handle: "ada" } };

/** Your own: Edit profile. */
export const Yours: Story = { args: { handle: "robin" } };

/** With the tabs under it. */
export const WithTabs: Story = {
  render: () => (
    <>
      <ProfileHeader handle="kwame" />
      <ProfileTabs handle="kwame" />
    </>
  ),
};

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
