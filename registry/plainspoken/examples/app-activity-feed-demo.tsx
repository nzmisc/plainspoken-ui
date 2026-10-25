import { AppActivityFeed } from "@/registry/plainspoken/blocks/app/activity-feed";

/** Who did what, with links, and how long ago from the demo's fixed "now". */
export default function AppActivityFeedDemo() {
  return <AppActivityFeed className="max-w-md" />;
}
