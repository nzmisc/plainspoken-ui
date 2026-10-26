"use client";

import { useId, useRef, useState } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Ellipsis, Pencil, Trash } from "@/registry/plainspoken/lib/icons";
import { KANBAN_NOW, ME, PEOPLE, type BoardComment, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { firstName, ms, newId, personById, splitMentions } from "@/registry/plainspoken/blocks/kanban/format";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Floating } from "@/registry/plainspoken/ui/floating";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

/** A comment's text: paragraphs, with "@Tom" mentions of members marked, and yours marked more */
export function CommentText({ text, people = PEOPLE, me = ME, className }: { text: string; people?: Person[]; me?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 leading-relaxed break-words", className)}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {splitMentions(para, people).map((part, j) =>
            "person" in part ? (
              <span key={j} title={`${part.person.name}, ${part.person.role}`} className={cn("bg-accent px-0.5 font-semibold", part.person.id === me && "outline outline-1 -outline-offset-1 outline-primary")}>
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export interface CommentBoxProps {
  /** Called with the text when sent */
  onSubmit: (text: string) => void;
  /** For editing: the text to start with, and what Cancel (or Escape) does */
  defaultValue?: string;
  onCancel?: () => void;
  submitLabel?: string;
  /** Who can be @mentioned */
  people?: Person[];
  me?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * A comment box: a text area that suggests members as you type "@" and the first letters of a
 * name (↑ ↓ to choose, Enter or Tab to put it in, Escape to close the list; focus stays in the
 * text all along, with the highlighted person as its active descendant), and Ctrl+Enter or ⌘+Enter
 * to send. While editing, Escape cancels.
 */
export function CommentBox({
  onSubmit,
  defaultValue = "",
  onCancel,
  submitLabel = "Comment",
  people = PEOPLE,
  me = ME,
  label = "Comment",
  placeholder = "Write a comment. Type @ to mention someone.",
  autoFocus = false,
  className,
}: CommentBoxProps) {
  const id = useId();
  const [text, setText] = useState(defaultValue);
  const [caret, setCaret] = useState(defaultValue.length);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(-1);
  const [focused, setFocused] = useState(autoFocus);
  const area = useRef<HTMLTextAreaElement>(null);

  // The mention being typed: "@" and letters just before the caret
  const typed = /(^|[^\p{L}\p{N}])@(\p{L}*)$/u.exec(text.slice(0, caret));
  const at = typed ? caret - typed[2].length - 1 : -1;
  const q = typed?.[2].toLowerCase() ?? "";
  // First names that start with what was typed, then any other name that does, then the rest that contain it
  const rank = (p: Person) => (firstName(p).toLowerCase().startsWith(q) ? 0 : p.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) ? 1 : p.name.toLowerCase().includes(q) ? 2 : 3);
  const matches =
    typed && focused && at !== dismissed
      ? people
          .filter((p) => p.id !== me && rank(p) < 3)
          .sort((a, b) => rank(a) - rank(b))
          .slice(0, 6)
      : [];
  const open = matches.length > 0;
  const current = Math.min(active, matches.length - 1);
  const option = (i: number) => `${id}-option-${i}`;

  const follow = (el: HTMLTextAreaElement) => setCaret(el.selectionStart);
  const pick = (p: Person) => {
    const insert = `@${firstName(p)} `;
    const next = text.slice(0, at) + insert + text.slice(caret);
    const pos = at + insert.length;
    setText(next);
    setCaret(pos);
    setActive(0);
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(pos, pos);
    });
  };
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText("");
    setCaret(0);
  };

  return (
    <form
      data-slot="kanban-comment-box"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <Textarea
        ref={area}
        rows={2}
        value={text}
        autoFocus={autoFocus}
        aria-label={label}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? option(current) : undefined}
        onChange={(e) => {
          setText(e.target.value);
          follow(e.target);
          setActive(0);
        }}
        onSelect={(e) => follow(e.currentTarget)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setActive((current + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
          } else if (open && (e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
            e.preventDefault();
            pick(matches[current]);
          } else if (open && e.key === "Escape") {
            // Only the list closes, not the dialog the box is in
            e.preventDefault();
            setDismissed(at);
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape" && onCancel) {
            e.preventDefault();
            onCancel();
          }
        }}
        className="min-h-14"
      />
      <Floating open={open} mode="manual" anchor={() => area.current} side="bottom" align="start" offset={2} className="w-72">
        <ul id={`${id}-list`} role="listbox" aria-label="People to mention" className="py-1">
          {matches.map((p, i) => (
            <li
              key={p.id}
              id={option(i)}
              role="option"
              aria-selected={i === current}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(p)}
              onPointerMove={() => i !== current && setActive(i)}
              className={cn("flex cursor-default items-center gap-2 px-2 py-1", i === current && "bg-primary text-primary-foreground")}
            >
              <Avatar name={p.name} src={p.picture} shape="circle" size={20} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className={cn("text-[12px]", i === current ? "text-primary-foreground/80" : "text-muted-foreground")}>{p.role}</span>
            </li>
          ))}
        </ul>
      </Floating>
      <p aria-live="polite" className="sr-only">
        {open ? `${matches.length === 1 ? "1 person matches" : `${matches.length} people match`}. Up and down to choose, Enter to mention.` : ""}
      </p>
      <div className="ctl-sm flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={!text.trim()}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <span className="text-[12px] text-muted-foreground max-sm:hidden">Ctrl+Enter or ⌘+Enter to send</span>
      </div>
    </form>
  );
}

export interface KanbanCommentsProps {
  /** The thread, oldest first. Leave out (and use defaultComments) to let it keep its own. */
  comments?: BoardComment[];
  defaultComments?: BoardComment[];
  onAdd?: (comment: BoardComment) => void;
  onEdit?: (comment: BoardComment) => void;
  onDelete?: (comment: BoardComment) => void;
  people?: Person[];
  /** The viewer: their comments can be edited and deleted */
  me?: string;
  /** The demo's clock, for "2 hours ago" and for comments added now */
  now?: string;
  /** Start with this comment of yours in edit mode (for stories) */
  defaultEditing?: string;
  className?: string;
}

/**
 * A card's comments, oldest first: round avatars, names, how long ago (and "edited"), the text
 * with @mentions marked, yours outlined. A long thread shows its latest five, with "Show 9 earlier
 * comments" above them, which unfolds the rest and moves focus to the first. Your own comments have a ⋯ menu to edit them in place or
 * delete them, which asks first. The box at the end adds a comment to the list.
 */
export function KanbanComments({
  comments,
  defaultComments = [],
  onAdd,
  onEdit,
  onDelete,
  people = PEOPLE,
  me = ME,
  now = KANBAN_NOW,
  defaultEditing,
  className,
}: KanbanCommentsProps) {
  const [own, setOwn] = useState(defaultComments);
  const list = comments ?? own;
  const [editing, setEditing] = useState<string | null>(defaultEditing ?? null);
  const [everything, setEverything] = useState(false);
  // A long thread starts with its latest five; the rest are behind a button
  const hidden = !everything && list.length > 7 ? list.length - 5 : 0;
  const [deleting, setDeleting] = useState<BoardComment | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const change = (next: BoardComment[]) => {
    if (!comments) setOwn(next);
  };
  const focusLater = (selector: string) => requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(selector)?.focus());
  const myself = personById(me, people);

  return (
    <div ref={root} data-slot="kanban-comments" className={cn("flex flex-col gap-3", className)}>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => {
            setEverything(true);
            focusLater(`[data-comment="${list[0].id}"]`);
          }}
          className={cn("flex w-full cursor-pointer items-center gap-3 py-1 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground", FOCUS_RING)}
        >
          <span aria-hidden className="h-px flex-1 bg-border" />
          Show {hidden} earlier comments
          <span aria-hidden className="h-px flex-1 bg-border" />
        </button>
      )}
      {list.length > 0 ? (
        <ol aria-label={hidden ? `Comments, the latest ${list.length - hidden} of ${list.length}` : "Comments"} className="flex flex-col">
          {list.slice(hidden).map((c) => {
            const who = personById(c.by, people);
            const mine = c.by === me;
            return (
              <li key={c.id} data-comment={c.id} tabIndex={-1} className="flex gap-2.5 border-b border-border py-2 outline-none first:pt-0 focus-visible:bg-muted">
                <Avatar name={who.name} src={who.picture} shape="circle" size={28} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-1.5 leading-tight">
                    <b className="font-semibold">{who.name}</b>
                    {mine && <span className="text-[12px] text-muted-foreground">(you)</span>}
                    <RelativeTime date={ms(c.at)} now={ms(now)} format="long" locale="en-GB" className="text-[12px] text-muted-foreground" />
                    {c.edited && <span className="text-[12px] text-muted-foreground">(edited)</span>}
                  </p>
                  {editing === c.id ? (
                    <CommentBox
                      defaultValue={c.body}
                      submitLabel="Save"
                      label="Edit your comment"
                      autoFocus={defaultEditing !== c.id}
                      people={people}
                      me={me}
                      onCancel={() => {
                        setEditing(null);
                        focusLater(`[data-comment="${c.id}"] [aria-haspopup]`);
                      }}
                      onSubmit={(body) => {
                        const next = { ...c, body, edited: body !== c.body || c.edited };
                        change(list.map((x) => (x.id === c.id ? next : x)));
                        onEdit?.(next);
                        setEditing(null);
                        focusLater(`[data-comment="${c.id}"] [aria-haspopup]`);
                      }}
                      className="mt-1"
                    />
                  ) : (
                    <CommentText text={c.body} people={people} me={me} className="mt-0.5" />
                  )}
                </div>
                {mine && editing !== c.id && (
                  <DropdownMenu
                    trigger={Ellipsis}
                    triggerVariant="ghost"
                    size="sm"
                    align="end"
                    label="Your comment: actions"
                    items={[
                      { label: "Edit", icon: Pencil, onSelect: () => setEditing(c.id) },
                      { type: "separator" },
                      { label: "Delete", icon: Trash, destructive: true, onSelect: () => setDeleting(c) },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-[13px] text-muted-foreground">No comments yet. Ask a question, or say how it is going.</p>
      )}
      <div className="flex gap-2.5">
        <Avatar name={myself.name} src={myself.picture} shape="circle" size={28} />
        <CommentBox
          people={people}
          me={me}
          label="New comment"
          onSubmit={(body) => {
            const c: BoardComment = { id: newId("m"), by: me, at: now, body };
            change([...list, c]);
            onAdd?.(c);
          }}
          className="min-w-0 flex-1"
        />
      </div>
      <AlertDialog
        open={deleting != null}
        onClose={() => setDeleting(null)}
        title="Delete your comment?"
        description="It goes for everyone on the board, and can't be brought back."
        confirmLabel="Delete comment"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          change(list.filter((x) => x.id !== deleting.id));
          onDelete?.(deleting);
          focusLater('textarea[aria-label="New comment"]');
        }}
      >
        {deleting && <blockquote className="border-l-2 border-border pl-2 text-muted-foreground">{deleting.body.length > 160 ? `${deleting.body.slice(0, 160)}…` : deleting.body}</blockquote>}
      </AlertDialog>
    </div>
  );
}
