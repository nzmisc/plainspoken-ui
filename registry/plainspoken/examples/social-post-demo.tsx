import { PostCard } from "@/registry/plainspoken/blocks/social/post";
import { postById } from "@/registry/plainspoken/blocks/social/data";

/** Posts with a picture, with #tags and @mentions as links, and a quote. Hover a name for the profile; the ⋯ has mute, block and report. */
export default function SocialPostDemo() {
  return (
    <ul className="max-w-[600px] border-x border-t border-border">
      {["grace-1", "r-priya-3", "juan-q"].map((id) => (
        <li key={id}>
          <PostCard post={postById(id)!} showReplyingTo />
        </li>
      ))}
    </ul>
  );
}
