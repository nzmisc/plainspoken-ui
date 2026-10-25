import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SocialApp } from "@/registry/plainspoken/blocks/social/app-shell";
import { PageHeader } from "@/registry/plainspoken/blocks/social/nav";
import { NotificationList, NotificationSettings } from "@/registry/plainspoken/blocks/social/notifications";
import { ProfileHeader, ProfileTabs } from "@/registry/plainspoken/blocks/social/profile";
import { PostThread } from "@/registry/plainspoken/blocks/social/thread";
import { Timeline } from "@/registry/plainspoken/blocks/social/timeline";

/** Murmur, the social demo at /demos/social. Nothing is published; buttons show how they would work. */
const meta: Meta<typeof SocialApp> = {
  title: "Demos/Social",
  component: SocialApp,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/social" } } },
};
export default meta;
type Story = StoryObj<typeof SocialApp>;

/** The home timeline. */
export const Home: Story = { args: { children: <Timeline /> } };

/** A post's page in a thread. */
export const Post: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/social/post/ada-3" } } },
  args: {
    children: (
      <>
        <PageHeader title="Post" backHref="#" />
        <PostThread id="ada-3" />
      </>
    ),
  },
};

/** A profile. */
export const Profile: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/social/u/robin" } } },
  args: {
    children: (
      <>
        <PageHeader title="Robin Achterberg" subtitle="9 posts" backHref="#" />
        <ProfileHeader handle="robin" />
        <ProfileTabs handle="robin" />
      </>
    ),
  },
};

/** Notifications. */
export const Notifications: Story = {
  parameters: { nextjs: { navigation: { pathname: "/demos/social/notifications" } } },
  args: {
    children: (
      <>
        <PageHeader title="Notifications" actions={<NotificationSettings />} />
        <NotificationList />
      </>
    ),
  },
};

/** Home on a phone. */
export const Phone: Story = { args: { children: <Timeline /> }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
