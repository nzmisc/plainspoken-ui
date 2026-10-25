import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Mail } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface BlogPostFooterLink {
  title: string;
  href: string;
}

export interface BlogPostFooterProps {
  /** The post's title, for the reply's subject line */
  title: string;
  /** The address replies go to. Leave out for no reply box. */
  replyTo?: string;
  /** After the address: what happens to replies */
  replyNote?: ReactNode;
  /** The post before this one */
  older?: BlogPostFooterLink;
  /** The post after this one */
  newer?: BlogPostFooterLink;
  className?: string;
}

function Neighbour({ link, dir }: { link?: BlogPostFooterLink; dir: "older" | "newer" }) {
  if (!link) return <div aria-hidden className="hidden sm:block" />;
  const newer = dir === "newer";
  return (
    <Link
      href={link.href}
      rel={newer ? "next" : "prev"}
      className={cn(
        "flex flex-col gap-0.5 px-3 py-2.5 text-foreground no-underline visited:text-foreground hover:bg-muted [&:hover_.title]:underline",
        newer && "sm:items-end sm:text-right",
        FOCUS_RING,
        "focus-visible:-outline-offset-2",
      )}
    >
      <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
        {!newer && <Icon icon={ArrowLeft} />}
        {newer ? "Newer post" : "Older post"}
        {newer && <Icon icon={ArrowRight} />}
      </span>
      <span className="title font-semibold underline-offset-2">{link.title}</span>
    </Link>
  );
}

/**
 * What comes after a post: an invitation to reply by email (a mailto: link with the subject
 * filled in, the comment section of a site without one), then the older and newer posts side by
 * side, older on the left as in a book.
 */
export function BlogPostFooter({
  title,
  replyTo,
  replyNote = "I read everything, answer most of it, and publish nothing without asking.",
  older,
  newer,
  className,
}: BlogPostFooterProps) {
  return (
    <footer data-slot="blog-post-footer" className={cn("flex flex-col gap-6", className)}>
      {replyTo && (
        <aside aria-label="Reply" className="flex items-start gap-3 border border-border border-l-4 border-l-foreground px-4 py-3">
          <Icon icon={Mail} className="mt-1 text-muted-foreground" />
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold">Have a thought on this?</p>
            <p>
              Reply by email:{" "}
              <a
                href={`mailto:${replyTo}?subject=${encodeURIComponent(`Re: ${title}`)}`}
                className="text-link underline underline-offset-2 visited:text-link-visited hover:decoration-2"
              >
                {replyTo}
              </a>
              . {replyNote}
            </p>
          </div>
        </aside>
      )}
      {(older || newer) && (
        <nav aria-label="More posts" className="grid border border-border sm:grid-cols-2 sm:divide-x sm:divide-border max-sm:divide-y max-sm:divide-border">
          <Neighbour link={older} dir="older" />
          <Neighbour link={newer} dir="newer" />
        </nav>
      )}
    </footer>
  );
}
