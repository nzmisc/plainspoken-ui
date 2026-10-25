import { NotificationList } from "@/registry/plainspoken/blocks/social/notifications";

/** Likes and reposts bundled with the faces of who did it, follows, and mentions and replies as whole posts, grouped by day. */
export default function SocialNotificationsDemo() {
  return (
    <div className="max-h-[600px] max-w-[600px] overflow-y-auto border border-border">
      <NotificationList />
    </div>
  );
}
