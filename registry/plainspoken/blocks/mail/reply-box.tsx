"use client";

import { useId, useState } from "react";
import { Forward, Reply, ReplyAll, Send, Trash } from "@/registry/plainspoken/lib/icons";
import type { Attachment, Person } from "@/registry/plainspoken/blocks/mail/data";
import { RecipientInput } from "@/registry/plainspoken/blocks/mail/recipient-input";
import { Button } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

export type ReplyMode = "reply" | "replyAll" | "forward";

const MODE = {
  reply: { icon: Reply, word: "Reply" },
  replyAll: { icon: ReplyAll, word: "Reply all" },
  forward: { icon: Forward, word: "Forward" },
} as const;

export interface MailReplyBoxProps {
  mode: ReplyMode;
  /** Who it goes to at first: the sender, everyone, or nobody (forward) */
  to: Person[];
  cc?: Person[];
  /** Forwarded files, listed under the box */
  attachments?: Attachment[];
  /** What the text box says at first */
  defaultBody?: string;
  contacts?: Person[];
  /** Send: what to do with the reply */
  onSend?: () => void;
  /** Discard: usually closes the box */
  onDiscard?: () => void;
  /** Put focus in the box when it appears. Default true. */
  autoFocus?: boolean;
  className?: string;
}

/**
 * The reply box under a conversation: who it goes to (as chips you can change, with suggestions),
 * a text box that takes focus when it opens, Send and Discard. Reply all adds a Cc row with the
 * others; Forward starts with nobody and lists the files that go along.
 */
export function MailReplyBox({ mode, to: startTo, cc: startCc = [], attachments = [], defaultBody = "", contacts, onSend, onDiscard, autoFocus = true, className }: MailReplyBoxProps) {
  const id = useId();
  const [to, setTo] = useState(startTo);
  const [cc, setCc] = useState(startCc);
  const m = MODE[mode];
  return (
    <section data-slot="mail-reply-box" aria-label={m.word} className={cn("mt-4 border border-border bg-background", className)}>
      <div className="flex items-start gap-2 border-b border-border px-2 py-1.5">
        <span className="flex h-7 shrink-0 items-center gap-1 text-[13px] font-semibold text-muted-foreground">
          <Icon icon={m.icon} />
          <label htmlFor={`${id}-to`}>{mode === "forward" ? "Forward to" : "To"}</label>
        </span>
        <RecipientInput
          id={`${id}-to`}
          label={mode === "forward" ? "Forward to" : "To"}
          value={to}
          onChange={setTo}
          contacts={contacts}
          autoFocus={autoFocus && mode === "forward"}
          className="flex-1 [&>div]:border-transparent"
        />
      </div>
      {cc.length > 0 && (
        <div className="flex items-start gap-2 border-b border-border px-2 py-1.5">
          <label htmlFor={`${id}-cc`} className="flex h-7 shrink-0 items-center text-[13px] font-semibold text-muted-foreground">
            Cc
          </label>
          <RecipientInput id={`${id}-cc`} label="Cc" value={cc} onChange={setCc} contacts={contacts} className="flex-1 [&>div]:border-transparent" />
        </div>
      )}
      <Textarea
        aria-label="Message"
        autoFocus={autoFocus && mode !== "forward"}
        rows={6}
        defaultValue={defaultBody}
        placeholder={mode === "forward" ? "Add a note (optional)" : "Write your reply"}
        className="border-0 focus-visible:-outline-offset-2"
      />
      {attachments.length > 0 && (
        <p className="border-t border-border px-2 py-1 text-[13px] text-muted-foreground">
          Forwarding {attachments.length === 1 ? "1 attachment" : `${attachments.length} attachments`}: {attachments.map((a) => a.name).join(", ")}
        </p>
      )}
      <div className="ctl-sm flex flex-wrap items-center gap-2 border-t border-border bg-muted px-2 py-1.5">
        <Button variant="primary" icon={Send} onClick={onSend}>
          Send
        </Button>
        <Button variant="ghost" icon={Trash} onClick={onDiscard} className="ml-auto">
          Discard
        </Button>
      </div>
    </section>
  );
}
