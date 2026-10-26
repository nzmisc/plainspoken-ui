"use client";

import { createContext, useContext, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, FaceSlightlySmiling, Image as ImageIcon, ListChecks, MapPin, Plus, X } from "@/registry/plainspoken/lib/icons";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { Select } from "@/registry/plainspoken/ui/select";
import { Separator } from "@/registry/plainspoken/ui/separator";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";
import { PostImage } from "@/registry/plainspoken/blocks/social/media";
import { QuotedPost } from "@/registry/plainspoken/blocks/social/post";
import { ME, userBy, type Post } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

export const POST_LIMIT = 280;

// Characters to insert. They are text in the post, not icons in the interface.
const EMOJI = ["😀", "😂", "🥲", "😍", "🤔", "😴", "🙌", "👏", "🔥", "✨", "🎉", "☕", "🥐", "🚲", "🌧️", "🌙", "📚", "🎧", "🌱", "❤️"];

/**
 * How much room is left: the number of characters, quiet until the last twenty, then in the
 * warning colour, and below zero in red with a minus sign. A polite live region says it once you
 * are near the limit, not on every key.
 */
export function CharacterCount({ length, limit = POST_LIMIT }: { length: number; limit?: number }) {
  const left = limit - length;
  const near = left <= 20;
  return (
    <span className={cn("text-[13px] tabular-nums", left < 0 ? "font-semibold text-destructive" : near ? "text-warning" : "text-muted-foreground")}>
      <span aria-hidden>{left < 0 ? `−${-left}` : left}</span>
      <span className="sr-only" aria-live="polite">
        {near ? (left < 0 ? `${-left} characters over the limit` : `${left} characters left`) : ""}
      </span>
    </span>
  );
}

export interface ComposerProps {
  /** Answering a post: "Replying to @ada", and the button says Reply */
  replyTo?: Post;
  /** Quoting a post: it shows under the text */
  quote?: Post;
  placeholder?: string;
  autoFocus?: boolean;
  /** After posting (closing a dialog) */
  onPosted?: () => void;
  className?: string;
}

/**
 * Writing a post: your picture, a text box that grows, and a row of tools: add a picture, a poll
 * (two to four choices and how long it runs), an emoji, a schedule and a place. The count shows
 * what's left of 280 characters; Post stays off while the box is empty or over the limit.
 * Ctrl+Enter (⌘+Enter) posts.
 */
export function Composer({ replyTo, quote, placeholder, autoFocus, onPosted, className }: ComposerProps) {
  const me = userBy(ME);
  const id = useId();
  const [text, setText] = useState("");
  const [image, setImage] = useState(false);
  const [poll, setPoll] = useState<string[] | null>(null);
  const tooLong = text.length > POST_LIMIT;
  const empty = !text.trim() && !image;
  const label = replyTo ? "Reply" : "Post";

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (empty || tooLong) return;
    toast({ title: replyTo ? "Your reply was sent" : "Your post was sent", description: "This is a demo: nothing was published.", variant: "success" });
    setText("");
    setImage(false);
    setPoll(null);
    onPosted?.();
  };

  return (
    <form onSubmit={submit} data-slot="social-composer" className={cn("grid grid-cols-[40px_minmax(0,1fr)] gap-x-2.5 px-3 py-2.5", className)}>
      <Avatar name={me.name} size={40} />
      <div className="flex min-w-0 flex-col gap-2">
        {replyTo && <p className="text-[13px] text-muted-foreground">Replying to @{replyTo.author}</p>}
        <label htmlFor={`${id}-text`} className="sr-only">
          {replyTo ? `Reply to @${replyTo.author}` : "What's happening?"}
        </label>
        <Textarea
          id={`${id}-text`}
          rows={replyTo ? 2 : 3}
          value={text}
          autoFocus={autoFocus}
          data-autofocus={autoFocus || undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
          }}
          placeholder={placeholder ?? (replyTo ? "Post your reply" : poll ? "Ask a question" : "What's happening?")}
          className="field-sizing-content min-h-16 resize-none text-[16px]"
        />
        {image && (
          <div className="relative">
            <PostImage seed={`draft-${text.length % 7}`} alt="A picture you added (generated for the demo)" />
            <IconButton size="sm" icon={X} label="Remove picture" onClick={() => setImage(false)} className="absolute top-1.5 right-1.5" />
          </div>
        )}
        {poll && (
          <fieldset className="flex flex-col gap-1.5 border border-border p-2.5">
            <legend className="px-1 text-[13px] font-semibold">Poll</legend>
            {poll.map((choice, i) => (
              <Input
                key={i}
                aria-label={`Choice ${i + 1}`}
                placeholder={`Choice ${i + 1}${i > 1 ? " (optional)" : ""}`}
                value={choice}
                maxLength={25}
                onChange={(e) => setPoll(poll.map((c, j) => (j === i ? e.target.value : c)))}
                className="w-full"
              />
            ))}
            <div className="flex flex-wrap items-center gap-2">
              {poll.length < 4 && (
                <Button size="sm" variant="ghost" icon={Plus} onClick={() => setPoll([...poll, ""])}>
                  Add a choice
                </Button>
              )}
              <label className="ml-auto flex items-center gap-1.5 text-[13px]">
                Runs for
                <Select
                  size="sm"
                  defaultValue="1d"
                  options={[
                    { value: "1h", label: "1 hour" },
                    { value: "1d", label: "1 day" },
                    { value: "3d", label: "3 days" },
                    { value: "7d", label: "7 days" },
                  ]}
                />
              </label>
              <Button size="sm" variant="destructive" onClick={() => setPoll(null)}>
                Remove poll
              </Button>
            </div>
          </fieldset>
        )}
        {quote && <QuotedPost id={quote.id} />}
        <Separator />
        <div className="ctl-sm flex items-center gap-0.5">
          <IconButton variant="ghost" icon={ImageIcon} label="Add a picture" onClick={() => setImage(true)} disabled={image} />
          <IconButton variant="ghost" icon={ListChecks} label="Add a poll" onClick={() => setPoll(["", ""])} disabled={!!poll || !!replyTo} />
          <Popover trigger={FaceSlightlySmiling} label="Add an emoji" triggerVariant="ghost" bodyClassName="p-1.5">
            {(close) => (
              <div className="grid grid-cols-5 gap-0.5">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="size-8 cursor-pointer text-[18px] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => {
                      setText((t) => t + e);
                      close();
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </Popover>
          <Tooltip content="Scheduling is not in this demo">
            <span tabIndex={0} className="inline-flex">
              <IconButton variant="ghost" icon={CalendarClock} label="Schedule" disabled />
            </span>
          </Tooltip>
          <IconButton variant="ghost" icon={MapPin} label="Tag a place" className="max-sm:hidden" onClick={() => toast("Places are not in this demo")} />
          <span className="ml-auto flex items-center gap-2.5">
            {text.length > 0 && <CharacterCount length={text.length} />}
            <Button type="submit" variant="primary" size="md" disabled={empty || tooLong} className="px-4">
              {label}
            </Button>
          </span>
        </div>
      </div>
    </form>
  );
}

export interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  quote?: Post;
  replyTo?: Post;
}

/** The composer in a dialog: from the nav's Post button, the phone's ✎ button, or "Quote" on a post */
export function ComposeDialog({ open, onClose, quote, replyTo }: ComposeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={quote ? "Quote post" : replyTo ? "Reply" : "New post"} bodyClassName="p-0" dismissOnBackdrop={false}>
      <Composer quote={quote} replyTo={replyTo} autoFocus onPosted={onClose} placeholder={quote ? "Add a comment" : undefined} />
    </Dialog>
  );
}

interface ComposeApi {
  /** Open the composer for a new post */
  compose: () => void;
  /** Open it quoting this post */
  quote: (post: Post) => void;
}

const ComposeCtx = createContext<ComposeApi | null>(null);

/** Open the compose dialog from anywhere under a ComposeProvider; null outside one (stories, docs) */
export function useCompose(): ComposeApi | null {
  return useContext(ComposeCtx);
}

/** Holds one ComposeDialog for the whole app, opened with useCompose() */
export function ComposeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; quote?: Post }>({ open: false });
  const api = useMemo<ComposeApi>(() => ({ compose: () => setState({ open: true }), quote: (post) => setState({ open: true, quote: post }) }), []);
  return (
    <ComposeCtx value={api}>
      {children}
      <ComposeDialog open={state.open} quote={state.quote} onClose={() => setState({ open: false })} />
    </ComposeCtx>
  );
}
