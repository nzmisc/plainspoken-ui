import { PostThread } from "@/registry/plainspoken/blocks/social/thread";

/** A post's page: the two posts before it in the thread, the post at full size, a reply box and the replies. */
export default function SocialThreadDemo() {
  return (
    <div className="max-w-[600px] border border-border">
      <PostThread id="ada-3" />
    </div>
  );
}
