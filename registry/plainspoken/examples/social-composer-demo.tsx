import { Composer } from "@/registry/plainspoken/blocks/social/composer";
import { postById } from "@/registry/plainspoken/blocks/social/data";

/** A new post, and a reply. Type past 260 characters to see the count warn, and past 280 for it to block Post. Try the poll and emoji buttons. */
export default function SocialComposerDemo() {
  return (
    <div className="flex max-w-[600px] flex-col gap-3">
      <Composer className="border border-border" />
      <Composer replyTo={postById("nora-1")} className="border border-border" />
    </div>
  );
}
