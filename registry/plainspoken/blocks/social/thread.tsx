"use client";

import { MessageCircle } from "@/registry/plainspoken/lib/icons";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Separator } from "@/registry/plainspoken/ui/separator";
import { Composer, useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { FocalPost, PostCard } from "@/registry/plainspoken/blocks/social/post";
import { ancestors, postById, repliesTo } from "@/registry/plainspoken/blocks/social/data";

/**
 * A post's page: the conversation above it (joined by a line down the avatars), the post itself
 * at full size, a box to reply, and the replies under it, each followed by its first answer.
 */
export function PostThread({ id }: { id: string }) {
  const compose = useCompose();
  const post = postById(id);
  if (!post) return <EmptyState title="This post doesn't exist" description="It may have been deleted, or the link is wrong." />;
  const above = ancestors(post);
  const replies = repliesTo(post.id);
  return (
    <div data-slot="social-thread">
      {above.length > 0 && (
        <ol aria-label="Earlier in the conversation">
          {above.map((p) => (
            <li key={p.id}>
              <PostCard post={p} threadLine onQuote={compose?.quote} />
            </li>
          ))}
        </ol>
      )}
      <FocalPost post={post} onQuote={compose?.quote} />
      <Composer replyTo={post} className="border-b border-border" />
      {replies.length ? (
        <ol aria-label="Replies">
          {replies.map((r) => {
            const next = repliesTo(r.id)[0];
            return (
              <li key={r.id}>
                <PostCard post={r} threadLine={!!next} onQuote={compose?.quote} />
                {next && <PostCard post={next} onQuote={compose?.quote} />}
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState compact icon={MessageCircle} title="No replies yet" description="Be the first to answer." />
      )}
      {replies.length > 0 && <Separator label="End of conversation" className="px-3 py-4" />}
    </div>
  );
}
