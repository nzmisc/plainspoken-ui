"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Archive, Eye, Pencil, TextAlignStart, UserPlus } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { useMediaQuery } from "@/registry/plainspoken/hooks/use-media-query";
import { DONE_COLUMN, KANBAN_NOW, KANBAN_TODAY, LABELS, ME, PEOPLE, TEAM, type ActivityEvent, type BoardCard, type BoardColumn, type BoardLabel, type LabelId, type Person, type Priority } from "@/registry/plainspoken/blocks/kanban/data";
import { columnOf, dayShort, dueState, labelById, ms, participants, personById, PRIORITIES, PRIORITY_ORDER, withActivity } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanActivity } from "@/registry/plainspoken/blocks/kanban/activity";
import { KanbanAttachments } from "@/registry/plainspoken/blocks/kanban/attachments";
import { KanbanChecklist } from "@/registry/plainspoken/blocks/kanban/checklist";
import { CommentText, KanbanComments } from "@/registry/plainspoken/blocks/kanban/comments";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { DatePicker } from "@/registry/plainspoken/ui/date-picker";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { DropdownMenu, type MenuItem } from "@/registry/plainspoken/ui/dropdown-menu";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { Select } from "@/registry/plainspoken/ui/select";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";

/** The small bold heading over a group in the card's side column */
function SideHeading({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="ctl-xs flex min-h-5 items-center justify-between gap-2">
      <h3 id={id} className="text-[13px] font-semibold">
        {children}
      </h3>
      {action}
    </div>
  );
}

/** A button that opens a menu, drawn as a small "Change" with a pencil, named for what it changes */
function ChangeMenu({ what, items }: { what: string; items: MenuItem[] }) {
  return (
    <DropdownMenu
      items={items}
      align="end"
      size="sm"
      trigger={(props) => (
        <Button {...props} size="xs" variant="ghost" icon={Pencil} aria-label={`Change ${what}`} className="text-muted-foreground hover:text-foreground">
          Change
        </Button>
      )}
    />
  );
}

export interface KanbanCardDetailProps {
  /** The card to show; null keeps it closed */
  card: BoardCard | null;
  /** The board's columns: the Status choices, and where the card is */
  columns: BoardColumn[];
  onClose: () => void;
  /**
   * Called with the whole card after each change (fields, checklist, files, comments), with what
   * happened added to its activity. Leave out to let the detail keep its own copy, for a demo.
   */
  onChange?: (card: BoardCard) => void;
  /** Status changed: move the card to the end of that column. Its activity is already updated through onChange. */
  onMove?: (columnId: string) => void;
  /** Shows "Archive card" */
  onArchive?: () => void;
  /** An address for the card, for "Copy link" */
  link?: string;
  people?: Person[];
  /** Ids of the people who are listed first when choosing assignees */
  team?: string[];
  labels?: BoardLabel[];
  /** The viewer, who is recorded as making each change */
  me?: string;
  /** The demo's date and clock */
  today?: ISODate;
  now?: string;
  /** The column whose cards are finished */
  doneColumn?: string;
  /** A dialog (wide screens) or a full-height drawer (phones). Default: by the screen's width. */
  layout?: "dialog" | "drawer";
  /** Which tab shows first under the files */
  defaultTab?: "comments" | "activity";
  /** Start with the description being edited (for stories) */
  defaultEditingDescription?: boolean;
}

/**
 * Everything on a card, in a dialog on wide screens and a full-height drawer on phones. The side
 * column has the status (its column), priority, due date with a date picker (and how it stands:
 * overdue, due soon), the people assigned (all of them, by name) and its labels, each changed from
 * a menu of checkboxes; the participants (who commented or watches) as a row of round avatars whose
 * "+N" opens the whole list, with Watch; then Copy link and Archive. The main column has the description (edited in
 * place), the checklist, the attachments with their upload, and Comments and Activity as tabs.
 * Every change is recorded in the activity as yours, so the Activity tab grows as you work.
 */
export function KanbanCardDetail({
  card,
  columns,
  onClose,
  onChange,
  onMove,
  onArchive,
  link,
  people = PEOPLE,
  team = TEAM,
  labels = LABELS,
  me = ME,
  today = KANBAN_TODAY,
  now = KANBAN_NOW,
  doneColumn = DONE_COLUMN,
  layout,
  defaultTab = "comments",
  defaultEditingDescription = false,
}: KanbanCardDetailProps) {
  const id = useId();
  const wide = useMediaQuery("(min-width: 40rem)", true);
  const asDialog = (layout ?? (wide ? "dialog" : "drawer")) === "dialog";

  // Without onChange it keeps its own copy, started afresh for each card opened
  const [own, setOwn] = useState(card);
  const [ownColumn, setOwnColumn] = useState<string | null>(null);
  const [shownId, setShownId] = useState(card?.id);
  const [editing, setEditing] = useState(defaultEditingDescription);
  const [draft, setDraft] = useState(card?.description ?? "");
  if (card?.id !== shownId) {
    setShownId(card?.id);
    setOwn(card);
    setOwnColumn(null);
    setEditing(defaultEditingDescription);
  }
  const c = onChange ? card : own;
  // Changes build on the latest card, not the one this render saw: two uploads can finish in one tick
  const latest = useRef(c);
  useLayoutEffect(() => {
    latest.current = c;
  });

  if (!c) return asDialog ? <Dialog open={false} onClose={onClose} title="" /> : <Drawer open={false} onClose={onClose} title="" />;

  const status = (!onMove && ownColumn) || columnOf(columns, c.id)?.id || columns[0]?.id;
  const column = columns.find((x) => x.id === status);
  /** Applies a change to the card, recording what happened in its activity when there is an event */
  const change = (f: (card: BoardCard) => BoardCard, event?: ActivityEvent) => {
    if (!latest.current) return;
    const changed = f(latest.current);
    const next = event ? withActivity(changed, me, now, event) : changed;
    latest.current = next;
    if (!onChange) setOwn(next);
    onChange?.(next);
  };
  const due = c.due ? dueState(c.due, today, status === doneColumn) : null;
  const who = c.assignees.map((p) => personById(p, people));
  const cardLabels = c.labels.map((l) => labelById(l, labels)).filter((l) => l != null);
  const creator = personById(c.createdBy, people);

  const toggleAssignee = (p: string, on: boolean) =>
    change((x) => ({ ...x, assignees: on ? [...x.assignees, p] : x.assignees.filter((y) => y !== p) }), { type: on ? "assigned" : "unassigned", person: p });
  const crowd = participants(c);
  const personItem = (p: Person): MenuItem => ({ type: "checkbox", label: p.id === me ? `${p.name} (you)` : p.name, checked: c.assignees.includes(p.id), onCheckedChange: (on) => toggleAssignee(p.id, on) });
  const assigneeMenu: MenuItem[] = [
    { type: "label", label: "App team" },
    ...people.filter((p) => team.includes(p.id)).map(personItem),
    { type: "separator" },
    { type: "label", label: "Everyone else" },
    ...people.filter((p) => !team.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)).map(personItem),
  ];
  const toggleLabel = (l: LabelId, on: boolean) => change((x) => ({ ...x, labels: on ? [...x.labels, l] : x.labels.filter((y) => y !== l) }), { type: on ? "labelled" : "unlabelled", label: l });

  const side = (
    <div className="flex flex-col gap-4 md:col-start-2 md:row-start-1">
      <div className="ctl-sm grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-1">
        <Field label="Status">
          <Select
            options={columns.map((x) => ({ value: x.id, label: x.title }))}
            value={status}
            onChange={(e) => {
              const to = columns.find((x) => x.id === e.target.value);
              if (!to || !column || to.id === column.id) return;
              change((x) => x, { type: "moved", from: column.title, to: to.title });
              setOwnColumn(to.id);
              onMove?.(to.id);
            }}
            className="w-full"
          />
        </Field>
        <Field label="Priority">
          <Select
            options={PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITIES[p].label }))}
            value={c.priority}
            onChange={(e) => {
              const priority = e.target.value as Priority;
              change((x) => ({ ...x, priority }), { type: "priority", priority });
            }}
            className="w-full"
          />
        </Field>
        <Field
          label="Due date"
          className="col-span-2 md:col-span-1"
          hint={
            due ? (
              <span className={cn(due.kind === "overdue" && "font-medium text-destructive", due.kind === "soon" && "font-medium text-warning")}>{due.long}</span>
            ) : (
              "No due date"
            )
          }
        >
          <span className="flex flex-wrap items-center gap-2">
            <DatePicker value={c.due} today={today} label="Due date" onChange={(d) => change((x) => ({ ...x, due: d }), { type: "due", date: d })} />
            {c.due && (
              <Button size="xs" variant="link" onClick={() => change((x) => ({ ...x, due: null }), { type: "due", date: null })}>
                Remove
              </Button>
            )}
          </span>
        </Field>
      </div>

      <section aria-labelledby={`${id}-people`} className="flex flex-col gap-1">
        <SideHeading id={`${id}-people`} action={<ChangeMenu what="assignees" items={assigneeMenu} />}>
          Assignees
        </SideHeading>
        {who.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {who.map((p) => (
              <li key={p.id} title={p.role} className="inline-flex items-center gap-1.5 leading-tight">
                <Avatar name={p.name} src={p.picture} shape="circle" size={20} aria-hidden />
                <span>
                  {p.name}
                  {p.id === me && <span className="text-muted-foreground"> (you)</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">Nobody yet.</p>
        )}
        {!c.assignees.includes(me) && (
          <Button size="xs" variant="link" icon={UserPlus} onClick={() => toggleAssignee(me, true)} className="self-start">
            Assign me
          </Button>
        )}
      </section>

      <section aria-labelledby={`${id}-participants`} className="flex flex-col gap-1">
        <SideHeading
          id={`${id}-participants`}
          action={
            <Toggle
              size="xs"
              variant="ghost"
              icon={Eye}
              pressed={c.watchers.includes(me)}
              onPressedChange={(on) => change((x) => ({ ...x, watchers: on ? [...x.watchers, me] : x.watchers.filter((w) => w !== me) }))}
              className="text-muted-foreground"
            >
              Watch
            </Toggle>
          }
        >
          Participants {crowd.length > 0 && <span className="font-normal text-muted-foreground tabular-nums">{crowd.length}</span>}
        </SideHeading>
        {crowd.length > 0 ? (
          <AvatarGroup shape="circle" size={24} max={6} overflow="list" label="Participants" listTitle={`Participants: ${crowd.length}`}>
            {crowd.map((p) => {
              const person = personById(p.id, people);
              return (
                <Avatar
                  key={p.id}
                  name={person.name}
                  src={person.picture}
                  detail={
                    p.commented ? (
                      <>
                        Commented <RelativeTime date={ms(p.commented)} now={ms(now)} format="long" locale="en-GB" />
                        {p.watching && ", watching"}
                      </>
                    ) : (
                      "Watching"
                    )
                  }
                />
              );
            })}
          </AvatarGroup>
        ) : (
          <p className="text-[13px] text-muted-foreground">Nobody has commented or watched it yet.</p>
        )}
      </section>

      <section aria-labelledby={`${id}-labels`} className="flex flex-col gap-1">
        <SideHeading
          id={`${id}-labels`}
          action={<ChangeMenu what="labels" items={labels.map((l) => ({ type: "checkbox", label: l.label, checked: c.labels.includes(l.id), onCheckedChange: (on) => toggleLabel(l.id, on) }))} />}
        >
          Labels
        </SideHeading>
        {cardLabels.length > 0 ? (
          <ul className="ctl-xs flex flex-wrap gap-1">
            {cardLabels.map((l) => (
              <li key={l.id}>
                <Chip name={l.label} onRemove={() => toggleLabel(l.id, false)}>
                  <span className="inline-flex items-center gap-1">
                    <Swatch color={l.color} />
                    {l.label}
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">None.</p>
        )}
      </section>

      <div className="ctl-sm flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {link && <CopyButton text={link} label="Copy link" size="sm" variant="default" />}
        {onArchive && (
          <Button size="sm" icon={Archive} onClick={onArchive}>
            Archive card
          </Button>
        )}
        <p className="w-full text-[12px] text-muted-foreground">
          Created by {creator.id === me ? "you" : creator.name} on {dayShort(c.createdAt.slice(0, 10))}
        </p>
      </div>
    </div>
  );

  const main = (
    <div className="flex min-w-0 flex-col gap-5 md:col-start-1 md:row-start-1">
      <section aria-labelledby={`${id}-desc`} className="flex flex-col gap-1.5">
        <div className="ctl-xs flex items-center justify-between gap-2">
          <h3 id={`${id}-desc`} className="flex items-center gap-1.5 text-[14px] font-bold">
            <Icon icon={TextAlignStart} className="text-muted-foreground" />
            Description
          </h3>
          {!editing && (
            <Button
              size="xs"
              variant="ghost"
              icon={Pencil}
              aria-label="Edit the description"
              onClick={() => {
                setDraft(c.description);
                setEditing(true);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Edit
            </Button>
          )}
        </div>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (text !== c.description) change((x) => ({ ...x, description: text }), { type: "described" });
              setEditing(false);
            }}
            className="flex flex-col gap-1.5"
          >
            <Textarea
              rows={6}
              autoFocus={!defaultEditingDescription}
              value={draft}
              aria-label="Description"
              placeholder="What is it, and how will you know it is done?"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
            />
            <div className="ctl-sm flex gap-2">
              <Button type="submit" variant="primary">
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : c.description ? (
          <CommentText text={c.description} people={people} me={me} className="max-w-[68ch]" />
        ) : (
          <p className="text-[13px] text-muted-foreground">No description yet.</p>
        )}
      </section>

      <KanbanChecklist
        items={c.checklist}
        onToggle={(item, done) =>
          change((x) => ({ ...x, checklist: x.checklist.map((i) => (i.id === item.id ? { ...i, done } : i)) }), { type: done ? "checked" : "unchecked", item: item.text })
        }
        onAdd={(item) => change((x) => ({ ...x, checklist: [...x.checklist, item] }))}
        onRemove={(item) => change((x) => ({ ...x, checklist: x.checklist.filter((i) => i.id !== item.id) }))}
      />

      <KanbanAttachments
        attachments={c.attachments}
        cover={c.cover}
        people={people}
        me={me}
        now={now}
        onAdd={(a) => change((x) => ({ ...x, attachments: [...x.attachments, a] }), { type: "attached", name: a.name })}
        onRemove={(a) => change((x) => ({ ...x, attachments: x.attachments.filter((i) => i.id !== a.id), cover: x.cover === a.id ? null : x.cover }), { type: "detached", name: a.name })}
        onCoverChange={(cover) => change((x) => ({ ...x, cover }), { type: "cover", name: c.attachments.find((a) => a.id === cover)?.name ?? null })}
      />

      <Tabs
        label="Discussion"
        variant="plain"
        size="sm"
        defaultValue={defaultTab}
        tabs={[
          {
            id: "comments",
            label: "Comments",
            count: c.comments.length,
            content: (
              <KanbanComments
                comments={c.comments}
                people={people}
                me={me}
                now={now}
                onAdd={(m) => change((x) => ({ ...x, comments: [...x.comments, m] }))}
                onEdit={(m) => change((x) => ({ ...x, comments: x.comments.map((i) => (i.id === m.id ? m : i)) }))}
                onDelete={(m) => change((x) => ({ ...x, comments: x.comments.filter((i) => i.id !== m.id) }))}
              />
            ),
          },
          { id: "activity", label: "Activity", count: c.activity.length, content: <KanbanActivity entries={c.activity} people={people} labels={labels} now={now} /> },
        ]}
      />
    </div>
  );

  const body = (
    // relative: the screen-reader-only live regions inside are placed against this, so they scroll with the body instead of stretching the dialog
    <div className="relative grid gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1fr)_15rem]">
      {side}
      {main}
    </div>
  );
  const description = `${c.id} in ${column?.title ?? "no column"}`;
  return asDialog ? (
    <Dialog open onClose={onClose} title={c.title} description={description} size="lg" bodyClassName="p-4">
      {body}
    </Dialog>
  ) : (
    <Drawer open onClose={onClose} side="right" sheetOnPhone={false} title={c.title} description={description} className="w-full sm:w-[32rem]">
      {body}
    </Drawer>
  );
}
