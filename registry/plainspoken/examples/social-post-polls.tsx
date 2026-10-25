import { FocalPost, PostCard } from "@/registry/plainspoken/blocks/social/post";
import { postById } from "@/registry/plainspoken/blocks/social/data";

/** Polls: one still open (vote to see the results) and one finished, with your vote checked. Then a post as its own page shows it. */
export default function SocialPostPolls() {
  return (
    <div className="max-w-[600px] border-x border-t border-border">
      <PostCard post={postById("marco-1")!} />
      <PostCard post={postById("robin-2")!} />
      <FocalPost post={postById("kk-1")!} />
    </div>
  );
}
