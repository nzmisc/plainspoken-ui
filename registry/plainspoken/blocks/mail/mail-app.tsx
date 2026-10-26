"use client";

import { useRef, useState, type ReactNode } from "react";
import { Archive, Clock, FileText, Inbox, Keyboard, LogOut, OctagonAlert, Send, Settings, SquarePen, Star, Trash, type Glyph } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { CONTACTS, LABELS, MAIL_NOW, MAIL_TODAY, ME, THREADS, type FolderId, type MailDraft, type MailThread, type MailView } from "@/registry/plainspoken/blocks/mail/data";
import { folderCounts, latest, senders, threadsIn, viewTitle } from "@/registry/plainspoken/blocks/mail/format";
import { mailMenuItems } from "@/registry/plainspoken/blocks/mail/actions";
import { MailComposeDialog } from "@/registry/plainspoken/blocks/mail/compose";
import { MailListToolbar } from "@/registry/plainspoken/blocks/mail/list-toolbar";
import { MailMessageList } from "@/registry/plainspoken/blocks/mail/message-list";
import { MailSearch } from "@/registry/plainspoken/blocks/mail/search";
import { MailShortcutsDialog } from "@/registry/plainspoken/blocks/mail/shortcuts";
import { MailThreadView } from "@/registry/plainspoken/blocks/mail/thread";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { Meter } from "@/registry/plainspoken/ui/progress";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/plainspoken/ui/resizable";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

const FOLDER_ICON: Record<FolderId | "starred", Glyph> = {
  inbox: Inbox,
  starred: Star,
  snoozed: Clock,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  spam: OctagonAlert,
  trash: Trash,
};

/** The sidebar: folders with their counts, then the labels with their colour squares */
export function mailSections(threads: MailThread[]): SidebarSection[] {
  const c = folderCounts(threads);
  const folder = (id: FolderId | "starred", badge?: number, badgeLabel?: string) => ({
    key: id,
    label: viewTitle(id),
    href: `#${id}`,
    icon: FOLDER_ICON[id],
    badge: badge || undefined,
    badgeLabel: badge ? badgeLabel : undefined,
  });
  return [
    {
      key: "folders",
      items: [
        folder("inbox", c.inbox, `${c.inbox} unread`),
        folder("starred"),
        folder("snoozed", c.snoozed, `${c.snoozed} snoozed`),
        folder("sent"),
        folder("drafts", c.drafts, `${c.drafts} drafts`),
        folder("archive"),
        folder("spam", c.spam, `${c.spam} unread`),
        folder("trash"),
      ],
    },
    {
      key: "labels",
      heading: "Labels",
      items: LABELS.map((l) => ({ key: `label:${l.id}`, label: l.label, href: `#label-${l.id}`, icon: <Swatch color={l.color} /> })),
    },
  ];
}

const draftOf = (t: MailThread): MailDraft => {
  const m = latest(t);
  return { id: t.id, to: m.to, cc: m.cc ?? [], subject: t.subject, body: m.body, attachments: m.attachments ?? [] };
};

export interface MailAppProps {
  /** The mailbox. Default: the demo's, Nora Lindqvist's at Fernhill Studio. */
  threads?: MailThread[];
  /** The folder or label shown first */
  defaultView?: MailView;
  /** The conversation open first; null for none */
  defaultOpenId?: string | null;
  /** Conversations ticked at first, to show the selection toolbar */
  selected?: string[];
  /** Start with the compose dialog open */
  defaultComposing?: boolean;
  /** On a phone, which pane shows first: the list (default) or the open conversation */
  defaultPane?: "list" | "message";
  /** More controls in the top bar, before the account menu: a theme switch */
  actions?: ReactNode;
  /** The demo's date and time */
  today?: ISODate;
  now?: string;
  /** The frame: full window height by default */
  className?: string;
}

/**
 * The whole mail client, three panes in an app shell: folders and labels in the sidebar (a rail
 * or a drawer on phones), the message list with search, filter chips and a selection toolbar, and
 * the reading pane, with a draggable line between list and message. On a phone it is one pane at
 * a time: the list, then the message with a back button. Compose opens the compose dialog, a
 * draft opens in it too, and the keyboard button lists the shortcuts.
 *
 * It is a picture of a mail app, not a working one: folders and messages open, menus and dialogs
 * open and close, but nothing is sent, moved or searched.
 */
export function MailApp({
  threads = THREADS,
  defaultView = "inbox",
  defaultOpenId = null,
  selected,
  defaultComposing = false,
  defaultPane = "list",
  actions,
  today = MAIL_TODAY,
  now = MAIL_NOW,
  className,
}: MailAppProps) {
  const [view, setView] = useState<MailView>(defaultView);
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  // A phone shows one pane: the list, until a conversation is picked (the one open by default is for wide screens)
  const [picked, setPicked] = useState(defaultPane === "message");
  const [compose, setCompose] = useState<MailDraft | null>(defaultComposing ? { to: [], cc: [], subject: "", body: "", attachments: [] } : null);
  const [help, setHelp] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const list = threadsIn(threads, view);
  const open = list.find((t) => t.id === openId) ?? null;
  const index = open ? list.indexOf(open) : -1;
  const title = viewTitle(view);
  const ticked = new Set(selected ?? []);
  const newMessage = () => setCompose({ to: [], cc: [], subject: "", body: "", attachments: [] });

  const openThread = (id: string) => {
    const t = list.find((x) => x.id === id);
    if (t?.folder === "drafts") return setCompose(draftOf(t));
    setOpenId(id);
    setPicked(true);
    // On a phone the message replaces the list: take focus there, to its subject
    if (!matchMedia("(min-width: 64rem)").matches) requestAnimationFrame(() => heading.current?.focus());
  };

  const menuFor = (t: MailThread) => {
    const m = mailMenuItems([t], view, now, today, () => {});
    return [
      { label: "Open", onSelect: () => openThread(t.id) },
      { type: "separator" as const },
      { type: "submenu" as const, label: "Snooze", icon: Clock, items: m.snooze },
      { type: "submenu" as const, label: "Move to", items: m.move },
      { type: "submenu" as const, label: "Label", items: m.labels },
    ];
  };

  return (
    <AppShell
      brand="Postbox"
      sections={mailSections(threads)}
      sidebarLabel="Folders"
      current={view}
      onNavigate={(key) => {
        setView(key as MailView);
        setOpenId(null);
      }}
      sidebarHeader={(rail) =>
        rail ? (
          <IconButton variant="primary" size="sm" icon={SquarePen} label="Compose" onClick={newMessage} />
        ) : (
          <Button variant="primary" icon={SquarePen} block onClick={newMessage}>
            Compose
          </Button>
        )
      }
      sidebarFooter={
        <div className="flex flex-col gap-0.5">
          <span>2.1 GB of 15 GB used</span>
          <Meter value={14} label="Storage used" valueText="14%" />
        </div>
      }
      actions={
        <>
          <IconButton variant="ghost" icon={SquarePen} label="Compose" onClick={newMessage} className="md:hidden" />
          <IconButton variant="ghost" icon={Keyboard} label="Keyboard shortcuts" onClick={() => setHelp(true)} className="max-sm:hidden" />
          {actions}
          <DropdownMenu
            align="end"
            label={`Account: ${ME.name}`}
            items={[
              { type: "label", label: `${ME.name}, ${ME.email}` },
              { label: "Keyboard shortcuts", icon: Keyboard, onSelect: () => setHelp(true) },
              { label: "Settings", icon: Settings },
              { type: "separator" },
              { label: "Sign out", icon: LogOut },
            ]}
            trigger={(props) => (
              <button {...props} aria-label={`Account: ${ME.name}`} className="flex cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
                <Avatar name={ME.name} size={28} />
              </button>
            )}
          />
        </>
      }
      className={cn("h-dvh", className)}
      mainClassName="flex overflow-hidden"
    >
      <ResizablePanelGroup className="min-w-0 flex-1">
        <ResizablePanel defaultSize={40} minSize={28} maxSize={60} className={cn("flex flex-col overflow-hidden", open && picked && "max-lg:hidden")}>
          <div className="flex flex-col gap-1.5 border-b border-border px-2.5 pt-2 pb-2">
            <h1 className="flex items-baseline gap-2 text-[16px] font-bold">
              {title}
              <span className="text-[13px] font-normal text-muted-foreground tabular-nums">{list.length}</span>
            </h1>
            <MailSearch key={view} senders={senders(list)} placeholder={`Search ${title}`} />
          </div>
          <MailListToolbar threads={list} selected={ticked} view={view} today={today} now={now} />
          <MailMessageList
            key={view}
            threads={list}
            view={view}
            today={today}
            openId={open?.id}
            selected={ticked}
            onOpen={openThread}
            menuFor={menuFor}
            label={`${title}: conversations`}
            empty={<EmptyState icon={FOLDER_ICON[view as FolderId] ?? Inbox} title={`Nothing in ${title}`} description="Conversations you move here will show up in this list." />}
            className="min-h-0 flex-1 overflow-y-auto"
          />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize the message list" className="max-lg:hidden" />
        <ResizablePanel defaultSize={60} minSize={30} className={cn("flex flex-col", !(open && picked) && "max-lg:hidden")}>
          {open ? (
            <MailThreadView
              key={open.id}
              thread={open}
              view={view}
              today={today}
              now={now}
              contacts={CONTACTS}
              onBack={() => {
                setOpenId(null);
                setPicked(false);
              }}
              backLabel={title}
              headingRef={heading}
              position={{
                index,
                total: list.length,
                onNewer: index > 0 ? () => setOpenId(list[index - 1].id) : undefined,
                onOlder: index < list.length - 1 ? () => setOpenId(list[index + 1].id) : undefined,
              }}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No conversation open"
              description={`Choose one from ${title} to read it here.`}
              className="my-auto"
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
      <MailComposeDialog open={compose != null} initial={compose ?? undefined} contacts={CONTACTS} onClose={() => setCompose(null)} />
      <MailShortcutsDialog open={help} onClose={() => setHelp(false)} />
    </AppShell>
  );
}
