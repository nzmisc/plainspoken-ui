import { Timeline } from "@/registry/plainspoken/blocks/social/timeline";
import { followingTimeline, forYou } from "@/registry/plainspoken/blocks/social/data";

/** The home timeline in a box: For you and Following, the composer, and the posts. ←/→ switch tabs. */
export default function SocialTimelineDemo() {
  return (
    <div className="max-h-[600px] max-w-[600px] overflow-y-auto border border-border">
      <Timeline forYouPosts={forYou().slice(0, 8)} followingPosts={followingTimeline().slice(0, 8)} />
    </div>
  );
}
