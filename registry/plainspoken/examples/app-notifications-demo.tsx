import { AppNotifications } from "@/registry/plainspoken/blocks/app/notifications";

/** The bell with its unread mark; click it for the list. */
export default function AppNotificationsDemo() {
  return (
    <div className="flex justify-end">
      <AppNotifications />
    </div>
  );
}
