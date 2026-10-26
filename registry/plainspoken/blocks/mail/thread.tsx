"use client";

import { useId, useState, type Ref } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Ellipsis, Forward, Reply, ReplyAll, Star, X } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { FOLDERS, LABELS, type MailMessage, type MailThread, type MailView, type Person } from "@/registry/plainspoken/blocks/mail/data";
import { ago, aheadTime, isMe, longTime, names, quoteHeader, snippet } from "@/registry/plainspoken/blocks/mail/format";
import { MailActions, type MailAction } from "@/registry/plainspoken/blocks/mail/actions";
import { MailAttachments } from "@/registry/plainspoken/blocks/mail/attachments";
import { MailReplyBox, type ReplyMode } from "@/registry/plainspoken/blocks/mail/reply-box";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { HoverCard, HoverCardActions, HoverCardFacts, HoverCardHeader } from "@/registry/plainspoken/ui/hover-card";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

/** Which messages start open: the last one, and, in an unread conversation, everything since your own last message */
function initiallyOpen(t: MailThread): Set<string> {
  const ids = t.messages.map((m) => m.id);
  const open = new Set([ids[ids.length - 1]]);
  if (t.unread) {
    const mine = t.messages.findLastIndex((m) => isMe(m.from));
    for (const m of t.messages.slice(mine + 1)) open.add(m.id);
  }
  return open;
}

/** Plain text in paragraphs; single line breaks stay (addresses, lists, sign-offs) */
export function MailBody({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex max-w-[72ch] flex-col gap-3 leading-relaxed break-words", className)}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function Quoted({ message, today }: { message: MailMessage; today: ISODate }) {
  return (
    <details className="group mt-3">
      <summary
        className={cn(
          "inline-flex h-5 cursor-pointer list-none items-center gap-1 border border-border bg-muted px-1.5 text-[12px] text-muted-foreground select-none hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden",
          FOCUS_RING,
        )}
      >
        <Icon icon={Ellipsis} />
        <span className="group-open:hidden">Show quoted text</span>
        <span className="hidden group-open:inline">Hide quoted text</span>
      </summary>
      <blockquote className="mt-2 border-l-2 border-border pl-3 text-muted-foreground">
        <p className="mb-2 text-[13px]">{quoteHeader(message, today)}</p>
        <MailBody text={message.body} />
      </blockquote>
    </details>
  );
}

interface MessageProps {
  thread: MailThread;
  message: MailMessage;
  previous?: MailMessage;
  today: ISODate;
  now: string;
  onReply?: (mode: ReplyMode, m: MailMessage) => void;
}

function Message({ thread: t, message: m, previous, today, now, onReply }: MessageProps) {
  const id = useId();
  const many = m.to.length + (m.cc?.length ?? 0) > 1;
  return (
    <article aria-labelledby={`${id}-from`} className="py-3">
      <header className="flex flex-wrap items-start gap-x-2.5 gap-y-1">
        <Avatar name={m.from.name} size={32} />
        <div className="min-w-0 flex-1 basis-48">
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            {isMe(m.from) ? (
              <b id={`${id}-from`}>{m.from.name} (me)</b>
            ) : (
              <HoverCard
                label={`${m.from.name}: contact card`}
                card={
                  <>
                    <HoverCardHeader title={m.from.name} aside={<Avatar name={m.from.name} size={24} />} />
                    <HoverCardFacts rows={[["Email", m.from.email], ["Works as", m.from.role], ["Messages", `${t.messages.filter((x) => x.from.email === m.from.email).length} in this conversation`]]} />
                    <HoverCardActions>
                      <a href={`mailto:${m.from.email}`} className="text-link underline visited:text-link-visited">
                        Write to {m.from.name.split(" ")[0]}
                      </a>
                      <CopyButton text={m.from.email} label="Copy address" size="xs" variant="default" />
                    </HoverCardActions>
                  </>
                }
              >
                <a id={`${id}-from`} href={`mailto:${m.from.email}`} className={cn("font-bold text-foreground no-underline visited:text-foreground hover:underline", FOCUS_RING)}>
                  {m.from.name}
                </a>
              </HoverCard>
            )}
            <span className="text-[13px] break-all text-muted-foreground">&lt;{m.from.email}&gt;</span>
          </p>
          <p className="text-[13px] text-muted-foreground">
            to {names(m.to) || "nobody yet"}
            {m.cc?.length ? `; cc ${names(m.cc)}` : ""}
          </p>
        </div>
        <div className="ctl-sm flex shrink-0 items-center gap-1">
          <time dateTime={m.date} title={ago(m.date, now)} className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
            {longTime(m.date, today)}
          </time>
          {onReply && (
            <>
              <IconButton variant="ghost" icon={Reply} label="Reply" onClick={() => onReply("reply", m)} />
              <DropdownMenu
                trigger={Ellipsis}
                label={`More for the message from ${m.from.name}`}
                triggerVariant="ghost"
                align="end"
                items={[
                  { label: "Reply", icon: Reply, onSelect: () => onReply("reply", m) },
                  { label: "Reply all", icon: ReplyAll, disabled: !many, onSelect: () => onReply("replyAll", m) },
                  { label: "Forward", icon: Forward, onSelect: () => onReply("forward", m) },
                ]}
              />
            </>
          )}
        </div>
      </header>
      <div className="mt-2 sm:pl-[42px]">
        <MailBody text={m.body} />
        {previous && <Quoted message={previous} today={today} />}
        {m.attachments?.length ? <MailAttachments attachments={m.attachments} className="mt-3" /> : null}
      </div>
    </article>
  );
}

function CollapsedMessage({ message: m, today, onOpen }: { message: MailMessage; today: ISODate; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      className={cn("flex w-full cursor-pointer items-center gap-2.5 py-2 text-left hover:bg-muted", FOCUS_RING, "focus-visible:-outline-offset-2")}
    >
      <Avatar name={m.from.name} size={24} />
      <span className="w-32 shrink-0 truncate font-semibold sm:w-40">{isMe(m.from) ? "me" : m.from.name}</span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{snippet(m)}</span>
      <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{longTime(m.date, today)}</span>
    </button>
  );
}

export interface MailThreadViewProps {
  thread: MailThread;
  /** The folder or view it was opened from: decides the toolbar's buttons */
  view: MailView;
  today: ISODate;
  /** The demo's clock, for "3 hours ago" and snooze times */
  now: string;
  /** Called with what was chosen in the toolbar. The buttons and menus work without it. */
  onAction?: (action: MailAction) => void;
  /** Back to the list: shown on narrow screens as "← Inbox", on wide ones as a × */
  onBack?: () => void;
  backLabel?: string;
  /** "3 of 18" with buttons for the newer and older conversation */
  position?: { index: number; total: number; onNewer?: () => void; onOlder?: () => void };
  /** People the reply box suggests */
  contacts?: Person[];
  /** Start with the reply box open (for stories and screenshots) */
  defaultReply?: ReplyMode | null;
  /** The subject heading, to move focus to when the conversation opens on a phone */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}

/** Who a reply goes to: the sender (or, replying to yourself, your recipients), and for Reply all everyone else in Cc */
function replyPeople(mode: ReplyMode, m: MailMessage): { to: Person[]; cc: Person[] } {
  if (mode === "forward") return { to: [], cc: [] };
  const to = isMe(m.from) ? m.to : [m.from];
  if (mode === "reply") return { to, cc: [] };
  const seen = new Set(to.map((p) => p.email));
  const cc = [...m.to, ...(m.cc ?? [])].filter((p) => !isMe(p) && !seen.has(p.email) && seen.add(p.email));
  return { to, cc };
}

/**
 * The reading pane: a conversation's subject, labels and toolbar, then its messages oldest first.
 * The latest message (and any unread ones) are open; earlier ones are one line each, and a long
 * run of them folds into "3 earlier messages". Each reply's quoted text is folded under "Show
 * quoted text", attachments are file chips with a preview, and Reply, Reply all and Forward sit
 * at the end; each opens the reply box in place, addressed to the right people. Spam, Trash and
 * Snoozed say so at the top, with the way out.
 */
export function MailThreadView({
  thread: t,
  view,
  today,
  now,
  onAction = () => {},
  onBack,
  backLabel = "Back",
  position,
  contacts,
  defaultReply = null,
  headingRef,
  className,
}: MailThreadViewProps) {
  const headingId = useId();
  const [reply, setReply] = useState<{ mode: ReplyMode; message: MailMessage } | null>(() =>
    defaultReply ? { mode: defaultReply, message: t.messages[t.messages.length - 1] } : null,
  );
  const onReply = (mode: ReplyMode, message: MailMessage) => setReply({ mode, message });
  const [open, setOpen] = useState(() => initiallyOpen(t));
  const [unfolded, setUnfolded] = useState(false);
  const firstOpen = t.messages.findIndex((m) => open.has(m.id));
  // Collapsed messages between the first and the first open one fold away when there are two or more
  const foldFrom = 1;
  const foldTo = firstOpen; // exclusive
  const folded = !unfolded && foldTo - foldFrom >= 2;
  const last = t.messages[t.messages.length - 1];
  const many = last.to.length + (last.cc?.length ?? 0) > 1;
  const labels = LABELS.filter((l) => t.labels.includes(l.id));
  const folder = FOLDERS.find((f) => f.id === t.folder);

  return (
    <section data-slot="mail-thread" aria-labelledby={headingId} className={cn("flex min-h-0 flex-col", className)}>
      <div className="ctl-sm sticky top-0 z-10 flex min-h-9 flex-wrap items-center gap-1 border-b border-border bg-background px-2 py-1">
        {onBack && (
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="lg:hidden">
            {backLabel}
          </Button>
        )}
        <MailActions threads={[t]} view={view} onAction={onAction} now={now} today={today} compact />
        <span className="ml-auto flex items-center gap-1">
          {position && (
            <>
              <span className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums max-sm:hidden">
                {position.index + 1} of {position.total}
              </span>
              <IconButton variant="ghost" icon={ChevronUp} label="Newer conversation (k)" disabled={!position.onNewer} onClick={position.onNewer} />
              <IconButton variant="ghost" icon={ChevronDown} label="Older conversation (j)" disabled={!position.onOlder} onClick={position.onOlder} />
            </>
          )}
          {onBack && <IconButton variant="ghost" icon={X} label="Close conversation (Esc)" onClick={onBack} className="max-lg:hidden" />}
        </span>
      </div>

      <div className="px-4 pt-3 pb-6">
        <div className="flex items-start gap-2">
          <h2 ref={headingRef} id={headingId} tabIndex={-1} className="min-w-0 flex-1 text-[18px] leading-snug font-bold focus:outline-none">
            {t.subject || "(no subject)"}
          </h2>
          <Toggle
            variant="ghost"
            size="sm"
            icon={Star}
            iconPressed={<Icon icon={Star} fill="currentColor" className="text-warning" />}
            label="Star"
            defaultPressed={t.starred}
            onPressedChange={(starred) => onAction({ type: "star", starred })}
            className="text-muted-foreground aria-pressed:border-transparent aria-pressed:bg-transparent"
          />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {folder && <Badge>{folder.label}</Badge>}
          {labels.map((l) => (
            <Badge key={l.id} icon={false} className="gap-1 bg-background">
              <Swatch color={l.color} />
              {l.label}
            </Badge>
          ))}
        </div>

        {t.folder === "spam" && (
          <Alert
            variant="warning"
            title="This conversation is in Spam"
            className="mt-3"
            actions={
              <Button onClick={() => onAction({ type: "spam", spam: false })}>Not spam</Button>
            }
          >
            It asks for money or details in a way that looks like scams others have reported. Don&apos;t follow its links.
          </Alert>
        )}
        {t.folder === "trash" && (
          <Alert title="In Trash" className="mt-3" actions={<Button onClick={() => onAction({ type: "move", folder: "inbox" })}>Move to Inbox</Button>}>
            Conversations in Trash are deleted for good after 30 days.
          </Alert>
        )}
        {t.folder === "snoozed" && t.snoozedUntil && (
          <Alert variant="info" title={`Snoozed until ${aheadTime(t.snoozedUntil, today)}`} className="mt-3" actions={<Button onClick={() => onAction({ type: "unsnooze" })}>Unsnooze</Button>}>
            It comes back to the top of your inbox then.
          </Alert>
        )}

        <div className="mt-3 divide-y divide-border border-y border-border">
          {t.messages.map((m, i) => {
            if (folded && i >= foldFrom && i < foldTo) {
              if (i > foldFrom) return null;
              const n = foldTo - foldFrom;
              return (
                <button
                  key="fold"
                  type="button"
                  onClick={() => setUnfolded(true)}
                  className={cn("flex w-full cursor-pointer items-center gap-3 py-1.5 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground", FOCUS_RING, "focus-visible:-outline-offset-2")}
                >
                  <span aria-hidden className="h-px flex-1 bg-border" />
                  {n} earlier messages
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </button>
              );
            }
            return open.has(m.id) ? (
              <Message key={m.id} thread={t} message={m} previous={t.messages[i - 1]} today={today} now={now} onReply={onReply} />
            ) : (
              <CollapsedMessage key={m.id} message={m} today={today} onOpen={() => setOpen((o) => new Set([...o, m.id]))} />
            );
          })}
        </div>

        {reply ? (
          <MailReplyBox
            key={`${reply.mode}-${reply.message.id}`}
            mode={reply.mode}
            {...replyPeople(reply.mode, reply.message)}
            attachments={reply.mode === "forward" ? reply.message.attachments : undefined}
            contacts={contacts}
            autoFocus={defaultReply == null}
            onSend={() => setReply(null)}
            onDiscard={() => setReply(null)}
          />
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={Reply} onClick={() => onReply("reply", last)}>
              Reply
            </Button>
            {many && (
              <Button icon={ReplyAll} onClick={() => onReply("replyAll", last)}>
                Reply all
              </Button>
            )}
            <Button icon={Forward} onClick={() => onReply("forward", last)}>
              Forward
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
