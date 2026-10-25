import type { Metadata } from "next";
import { PageHeader } from "@/registry/plainspoken/blocks/social/nav";
import { NotificationList, NotificationSettings } from "@/registry/plainspoken/blocks/social/notifications";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Likes, reposts, follows, mentions and replies, grouped by day.",
};

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" actions={<NotificationSettings />} />
      <NotificationList />
    </>
  );
}
