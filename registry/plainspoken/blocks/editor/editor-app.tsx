"use client";

import { useState, type ReactNode } from "react";
import { FilePenLine, FilePlus, FileText, LogOut, Settings } from "@/registry/plainspoken/lib/icons";
import { DOCS, EDITOR_NOW, ME, SECTIONS, type EditorDoc } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocument } from "@/registry/plainspoken/blocks/editor/document";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import type { EditorMode } from "@/registry/plainspoken/ui/rich-text-editor";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

/** The sidebar: the handbook's parts, each with its pages; drafts marked */
export function editorSections(docs: EditorDoc[]): SidebarSection[] {
  return SECTIONS.map((section) => ({
    key: section,
    heading: section,
    items: docs
      .filter((d) => d.section === section)
      .map((d) => ({
        key: d.id,
        label: d.title || "Untitled",
        href: `#${d.id}`,
        icon: d.status === "draft" ? FilePenLine : FileText,
        badge: d.status === "draft" ? "draft" : undefined,
      })),
  })).filter((s) => s.items.length);
}

export interface EditorAppProps {
  /** The handbook. Default: the demo's, Ropewalk Studio's. */
  docs?: EditorDoc[];
  /** The page open first */
  defaultDocId?: string;
  /** The editor's mode for the first page */
  defaultMode?: EditorMode;
  /** More controls in the top bar, before the account menu: a theme switch */
  actions?: ReactNode;
  /** The demo's clock, for "saved … ago" */
  now?: string;
  /** The frame: full window height by default */
  className?: string;
}

let made = 0;

/**
 * Quire, a team handbook: its pages by part in the sidebar (drafts marked), and the open page in
 * the editor, with its title, status, word count and last save above the text. New page starts an
 * untitled draft in the open page's part; Publish, Unpublish, Duplicate and Delete change the list.
 * On a phone the sidebar is a drawer. It is a picture of an app: nothing is stored.
 */
export function EditorApp({ docs: initial = DOCS, defaultDocId, defaultMode, actions, now = EDITOR_NOW, className }: EditorAppProps) {
  const [docs, setDocs] = useState(initial);
  const [openId, setOpenId] = useState(defaultDocId ?? initial[0]?.id);
  const open = docs.find((d) => d.id === openId) ?? null;

  const add = (base: Partial<EditorDoc>) => {
    const doc: EditorDoc = {
      id: `page-${++made}`,
      title: "",
      status: "draft",
      section: open?.section ?? SECTIONS[0],
      savedAt: new Date().toISOString(),
      savedBy: ME.id,
      body: "",
      ...base,
    };
    setDocs((ds) => [...ds, doc]);
    setOpenId(doc.id);
  };
  const newPage = () => add({});

  return (
    <AppShell
      brand="Quire"
      sections={editorSections(docs)}
      sidebarLabel="Handbook pages"
      current={open?.id}
      onNavigate={(key) => setOpenId(key)}
      sidebarHeader={(rail) =>
        rail ? (
          <IconButton variant="primary" size="sm" icon={FilePlus} label="New page" onClick={newPage} />
        ) : (
          <Button variant="primary" icon={FilePlus} block onClick={newPage}>
            New page
          </Button>
        )
      }
      sidebarFooter={
        <span>
          Ropewalk Studio handbook: {docs.filter((d) => d.status === "published").length} published, {docs.filter((d) => d.status === "draft").length} drafts
        </span>
      }
      actions={
        <>
          {actions}
          <DropdownMenu
            align="end"
            label={`Account: ${ME.name}`}
            items={[
              { type: "label", label: ME.name },
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
      {open ? (
        <EditorDocument
          key={open.id}
          doc={open}
          defaultMode={open.id === defaultDocId ? defaultMode : undefined}
          now={now}
          onSave={(d) => setDocs((ds) => ds.map((x) => (x.id === d.id ? d : x)))}
          onDuplicate={(d) => add({ title: `${d.title} (copy)`, body: d.body, section: d.section })}
          onDelete={(d) => {
            const rest = docs.filter((x) => x.id !== d.id);
            setDocs(rest);
            setOpenId(rest[0]?.id);
          }}
          className="flex-1"
        />
      ) : (
        <EmptyState icon={FileText} title="No page open" description="Choose a page from the handbook, or start a new one." className="my-auto flex-1" />
      )}
    </AppShell>
  );
}
