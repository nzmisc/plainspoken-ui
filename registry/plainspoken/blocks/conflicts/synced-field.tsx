"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { diffChars, insertedRanges } from "@/registry/plainspoken/lib/diff";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { Announcer, Facepile, TextareaCursors, firstName, useAnnouncer, type PresenceEntry, type RemoteCursor } from "@/registry/plainspoken/ui/presence";
import { AMARA, JONAS, TICKET_ID, TICKET_TITLE } from "@/registry/plainspoken/blocks/conflicts/content";
import type { ClientState, Sim } from "@/registry/plainspoken/blocks/conflicts/sim";
import { cn } from "@/lib/utils";

export interface SyncedTextareaProps {
  sim: Sim;
  client: ClientState;
  label: ReactNode;
  /** A line under the label */
  hint?: ReactNode;
  readOnly?: boolean;
  /** ids of things that describe the field: a presence tag, a notice */
  describedBy?: string;
  /** Draw the other person's caret and selection over the text */
  showPeerCursor?: boolean;
  /** Tint text that arrived from someone else for a moment. Default true. */
  flash?: boolean;
  rows?: number;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  /** Wraps the text box (not the label): a PresenceFrame, say */
  frame?: (box: ReactNode) => ReactNode;
  className?: string;
}

/**
 * A textarea bound to one client of a Sim: typing, the caret and focus go to the sim (so the
 * other person sees them), and text that arrives from elsewhere keeps your caret on the same
 * words: the sim carries your selection through the change and this puts it back. What arrived
 * is tinted for two seconds in the colour of whoever wrote it.
 */
export function SyncedTextarea({ sim, client, label, hint, readOnly, describedBy, showPeerCursor, flash = true, rows = 6, textareaRef, frame, className }: SyncedTextareaProps) {
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? own;
  const id = `${client.side}-${client.person.id}-field`;
  const side = client.side;

  // Text from elsewhere: put the caret back where the sim carried it
  useLayoutEffect(() => {
    const el = ref.current;
    const sel = client.selection;
    if (el && sel && document.activeElement === el) el.setSelectionRange(sel.start, sel.end);
    // Only when the text came from elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.external]);

  const flashes = useArrivals(client, flash);
  const peer = client.peer;
  const cursors: RemoteCursor[] = [...flashes];
  if (showPeerCursor && peer?.online && peer.focused && peer.selection) {
    cursors.push({ person: peer.person, start: peer.selection.start, end: peer.selection.end, label: `${firstName(peer.person)} typing`, flag: peer.typing });
  }

  const box = (
    <div className="relative">
      <Textarea
        id={id}
        ref={ref}
        rows={rows}
        value={client.text}
        readOnly={readOnly}
        aria-describedby={describedBy}
        onChange={(e) => sim.type(side, e.target.value, { start: e.target.selectionStart, end: e.target.selectionEnd })}
        onSelect={(e) => sim.select(side, { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
        onFocus={() => sim.focus(side, true)}
        onBlur={() => sim.focus(side, false)}
        className={cn("leading-[1.55]", readOnly && "cursor-default bg-muted text-foreground")}
      />
      <TextareaCursors textarea={ref} value={client.text} cursors={cursors} />
    </div>
  );
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[14px] font-semibold">
        {label}
      </label>
      {hint && <p className="-mt-0.5 text-[13px] text-muted-foreground">{hint}</p>}
      {frame ? frame(box) : box}
    </div>
  );
}

/**
 * Ranges of text that just arrived from someone else, for two seconds: worked out from the
 * text before and after each outside change.
 */
export function useArrivals(client: ClientState, on = true): RemoteCursor[] {
  const [marks, setMarks] = useState<RemoteCursor[]>([]);
  const prev = useRef(client.text);
  const external = useRef(client.external);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const before = prev.current;
    prev.current = client.text;
    if (external.current === client.external) {
      // Your own typing: the marks' offsets would be off now
      setMarks((m) => (m.length ? [] : m));
      return;
    }
    external.current = client.external;
    if (!on) return;
    const author = client.side === "you" ? JONAS : AMARA;
    const ranges = insertedRanges(diffChars(before, client.text)).filter((r) => r.end > r.start);
    if (ranges.length === 0) return;
    // Arrivals come from timers, not from rendering: setting state here is how they show
    setMarks(ranges.map((r) => ({ person: author, ...r, highlight: true })));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMarks([]), 2000);
  }, [client.text, client.external, client.side, on]);
  return marks;
}

/** Announces the sim's news for this person, politely and at most every few seconds */
export function NewsAnnouncer({ client }: { client: ClientState }) {
  const { message, announce } = useAnnouncer(3000);
  useEffect(() => {
    if (client.news.n > 0) announce(client.news.text);
  }, [client.news, announce]);
  return <Announcer message={message} />;
}

/** "Saving…", "All changes saved", "Not saved yet", "Offline: …", in words */
export function SaveStatus({ client, autosave, className }: { client: ClientState; autosave: boolean; className?: string }) {
  const dirty = client.text !== client.base.text;
  let text: string;
  if (client.resolving) text = "Not saved yet: choose a version for the marked part first. The rest is merged.";
  else if (autosave && client.incoming) text = "Not saved yet: choose which version stays.";
  else if (!client.online) text = dirty ? "Offline: your changes are kept on this screen and sent when you're back." : "Offline.";
  else if (autosave) text = client.pending || dirty ? "Saving…" : client.savedAt ? "All changes saved." : "Saved.";
  else text = dirty ? "Not saved yet." : client.savedAt ? "Saved." : "No changes.";
  return <p className={cn("text-[12px] text-muted-foreground", className)}>{text}</p>;
}

/** The other person, for a Facepile: what they are doing, or that they are offline */
export function peerEntries(client: ClientState): PresenceEntry[] {
  const p = client.peer;
  if (!client.online || !p) return [];
  if (!p.online) return [{ person: p.person, status: "offline", away: true }];
  return [{ person: p.person, status: p.typing ? "typing" : p.focused ? "editing" : "viewing" }];
}

/** "Jonas is typing…", "Jonas is editing", or nothing */
export function peerDoing(client: ClientState): string | null {
  const p = client.peer;
  if (!client.online || !p?.online || !p.focused) return null;
  return p.typing ? `${firstName(p.person)} is typing…` : `${firstName(p.person)} is editing`;
}

/** The ticket the text box belongs to, with who else has it open */
export function TicketHeader({ client, presence = true, caption }: { client: ClientState; presence?: boolean; caption?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="min-w-0 text-[13px]">
        <span className="font-mono text-muted-foreground">{TICKET_ID}</span> <span className="font-semibold">{TICKET_TITLE}</span>
      </p>
      {presence && (client.online ? <Facepile people={peerEntries(client)} caption={caption} /> : <span className="text-[13px] text-muted-foreground">Offline: you can&apos;t see who&apos;s here</span>)}
    </div>
  );
}
