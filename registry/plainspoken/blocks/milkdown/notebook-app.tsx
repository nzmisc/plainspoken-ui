"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { FileText, LogOut, RotateCcw, Settings } from "@/registry/plainspoken/lib/icons";
import { useStoredState } from "@/registry/plainspoken/hooks/use-stored-state";
import { DEFAULT_PAGE, ME, NOTEBOOK_NOW, PAGES, PEOPLE, fakeUpload, type NotebookPage, type PageTemplate } from "@/registry/plainspoken/blocks/milkdown/data";
import { NotebookPageHeader } from "@/registry/plainspoken/blocks/milkdown/document-header";
import { countWords, newPageId, outline, searchPages } from "@/registry/plainspoken/blocks/milkdown/format";
import { NotebookOutline, OutlineMenu, currentHeading, scrollToHeading } from "@/registry/plainspoken/blocks/milkdown/outline";
import { NewPageMenu, PageTreeHeader, notebookSections } from "@/registry/plainspoken/blocks/milkdown/page-tree";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { AppShell } from "@/registry/plainspoken/ui/app-shell";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { MilkdownEditor, type EditorMode, type MilkdownEditorHandle } from "@/registry/plainspoken/ui/milkdown-editor";
import type { SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { cn } from "@/lib/utils";

const NOTHING: SidebarSection[] = [{ key: "nothing", items: [] }];

// The address's #fragment, as a store: the open page lives there, so links between pages, Back
// and reloading all work
const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
  };
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const noHash = () => "";
const ignore = () => () => {};
const yes = () => true;
const no = () => false;

/** The header's content lines up with the editor's text column (its `measure`) */
const COLUMN = "mx-auto w-full max-w-[calc(75ch+2.75rem)] text-[14px] pr-3 pl-3 sm:pl-8";

export interface NotebookAppProps {
  /** The pages it starts with, and what Reset brings back. Default: Pennant's. */
  pages?: NotebookPage[];
  /** The page open first, when the address doesn't name one */
  defaultPageId?: string;
  /**
   * localStorage key to keep the pages (and the sidebar's layout) under, so edits outlast a
   * reload. Leave out to keep them only until then.
   */
  storageKey?: string;
  /** Put the open page in the address (#rfc-0042) and follow it. On by default; off for several on one page. */
  hashRouting?: boolean;
  defaultMode?: EditorMode;
  /** More controls in the top bar, before the account menu: a theme switch */
  actions?: ReactNode;
  /** The demo's clock, for "edited … ago" on the pages as they came */
  now?: string;
  /** The frame: full window height by default */
  className?: string;
}

/**
 * Pennant's engineering notebook: RFCs, runbooks, incident reviews and on-call notes in a page
 * tree, each page in the Milkdown editor under a header with its title, status, authors and
 * length, and an outline beside it ("On this page", a menu below xl widths) that follows the
 * reading and jumps to a heading. Search filters the tree by title and text, with match counts.
 * New page starts from a template; the ⋯ menu sets the status, duplicates or deletes. The open
 * page is in the address, so links between pages (`[Rota](#rota)`), Back and reloads work. With
 * `storageKey` the pages are kept in this browser; Reset demo pages brings back the originals.
 */
export function NotebookApp({
  pages: initial = PAGES,
  defaultPageId = DEFAULT_PAGE,
  storageKey,
  hashRouting = true,
  defaultMode = "write",
  actions,
  now = NOTEBOOK_NOW,
  className,
}: NotebookAppProps) {
  const [pages, setPages] = useStoredState<NotebookPage[]>(storageKey && `${storageKey}:pages:v1`, initial);
  const hash = useSyncExternalStore(hashRouting ? onHash : ignore, hashRouting ? readHash : noHash, noHash);
  const [chosen, setChosen] = useState(defaultPageId);
  const openId = pages.some((p) => p.id === hash) ? hash : chosen;
  const page = pages.find((p) => p.id === openId) ?? null;

  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [query, setQuery] = useState("");
  // What the confirmation asks about (kept while it closes), and whether it is open
  const [confirm, setConfirm] = useState<{ kind: "delete"; page: NotebookPage } | { kind: "reset" }>({ kind: "reset" });
  const [asking, setAsking] = useState(false);
  const ask = (c: typeof confirm) => {
    setConfirm(c);
    setAsking(true);
  };
  const [fresh, setFresh] = useState(0);
  // The heading being read; one chosen from the outline counts until the reader scrolls by hand
  // (it may be too near the end to reach the top)
  const [at, setAt] = useState({ page: openId, index: 0, chosen: false });
  if (at.page !== openId) setAt({ page: openId, index: 0, chosen: false });

  const column = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const editor = useRef<MilkdownEditorHandle>(null);
  const frame = useRef(0);
  const pendingHeading = useRef<number | null>(null);

  const matches = useMemo(() => searchPages(pages, query), [pages, query]);
  // AppShell leaves out a sidebar with nothing in it; this one keeps New page and the search box
  // when no page matches, or there are none
  const sections = useMemo(() => {
    const found = notebookSections(pages, matches);
    return found.length ? found : NOTHING;
  }, [pages, matches]);
  const entries = useMemo(() => outline(page?.body ?? ""), [page?.body]);
  const words = useMemo(() => countWords(`${page?.title ?? ""}\n${page?.body ?? ""}`), [page?.title, page?.body]);
  const current = Math.min(at.index, entries.length - 1);

  const open = (id: string, replace = false) => {
    setChosen(id);
    if (!hashRouting || readHash() === id) return;
    // No state of our own: a client router (Next's) then copies its own in and takes the new address
    if (replace) window.history.replaceState(null, "", `#${id}`);
    else window.history.pushState(null, "", `#${id}`);
  };

  /** Changes a page; an edit (not a reset) stamps it as yours, now */
  const update = (id: string, patch: Partial<NotebookPage>) =>
    setPages((ps) =>
      ps.map((p) =>
        p.id !== id
          ? p
          : { ...p, ...patch, editedAt: new Date().toISOString(), editedBy: ME, authors: p.authors.includes(ME) ? p.authors : [...p.authors, ME] },
      ),
    );

  const create = (t: PageTemplate) => {
    const id = newPageId("", (x) => pages.some((p) => p.id === x));
    const made: NotebookPage = {
      id,
      title: "",
      kind: t.kind,
      section: t.section ?? page?.section ?? "rfcs",
      folder: t.section ? t.folder : page?.folder,
      status: "draft",
      authors: [ME],
      editedAt: new Date().toISOString(),
      editedBy: ME,
      body: t.body,
    };
    // At the end of its folder (or part), where the tree shows it
    setPages((ps) => {
      let at = ps.length;
      ps.forEach((p, i) => {
        if (p.section === made.section && p.folder === made.folder) at = i + 1;
      });
      return [...ps.slice(0, at), made, ...ps.slice(at)];
    });
    open(id);
    setFresh((n) => n + 1);
  };

  const duplicate = (from: NotebookPage) => {
    const id = newPageId(`${from.title} copy`, (x) => pages.some((p) => p.id === x));
    const copy: NotebookPage = { ...from, id, title: `${from.title} (copy)`, status: "draft", authors: [ME], editedAt: new Date().toISOString(), editedBy: ME };
    setPages((ps) => ps.flatMap((p) => (p.id === from.id ? [p, copy] : [p])));
    open(id);
  };

  const remove = (gone: NotebookPage) => {
    // On to the page after it in the tree, or the one before at the end
    const order = notebookSections(pages).flatMap((s) => s.items.flatMap((it) => (it.children ? it.children.map((c) => c.key) : [it.key])));
    const i = order.indexOf(gone.id);
    const rest = order.filter((id) => id !== gone.id);
    setPages((ps) => ps.filter((p) => p.id !== gone.id));
    const next = rest[Math.min(i, rest.length - 1)];
    if (next) open(next, true);
  };

  // A new page: straight into its title. The New page menu puts focus back on its button as it
  // closes, which can come a moment later, so the title takes it again after that.
  useEffect(() => {
    if (!fresh) return;
    const focus = () => title.current?.focus();
    focus();
    const closed = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") setTimeout(focus);
    };
    window.addEventListener("toggle", closed, true);
    const stop = setTimeout(() => window.removeEventListener("toggle", closed, true), 500);
    return () => {
      clearTimeout(stop);
      window.removeEventListener("toggle", closed, true);
    };
  }, [fresh]);

  // A page opened from a link in the text (or by Back) takes away what had focus: carry on from the
  // main area, not from the top of the document. Not for the page the address names on load, which
  // shows just after hydration.
  const live = useSyncExternalStore(ignore, yes, no);
  const shown = useRef<string | null>(null);
  useEffect(() => {
    if (!live || shown.current === openId) return;
    const first = shown.current === null;
    shown.current = openId;
    if (!first && document.activeElement === document.body) column.current?.closest("main")?.focus({ preventScroll: true });
  }, [live, openId]);

  // Choosing a heading from Markdown mode switches to Write, then scrolls once the text shows
  useEffect(() => {
    const i = pendingHeading.current;
    if (i == null || mode === "markdown") return;
    pendingHeading.current = null;
    frame.current = requestAnimationFrame(() => scrollToHeading(column.current, i));
  }, [mode]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const goTo = (index: number) => {
    setAt({ page: openId, index, chosen: true });
    if (mode === "markdown") {
      pendingHeading.current = index;
      setMode("write");
    } else scrollToHeading(column.current, index);
  };

  // Which heading is being read, from the editor's scrolling (scroll doesn't bubble: captured)
  const track = () => {
    if (mode === "markdown" || at.chosen) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setAt({ page: openId, index: Math.max(0, currentHeading(column.current)), chosen: false }));
  };
  const byHand = () => at.chosen && setAt((a) => ({ ...a, chosen: false }));

  const reset = (rail: boolean) =>
    rail ? (
      <IconButton variant="ghost" size="sm" icon={RotateCcw} label="Reset demo pages" onClick={() => ask({ kind: "reset" })} />
    ) : (
      <div className="flex flex-col items-start gap-1">
        <span>{storageKey ? "Your changes are kept in this browser." : "Your changes last until you reload."}</span>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => ask({ kind: "reset" })} className="-ml-2">
          Reset demo pages
        </Button>
      </div>
    );

  const me = PEOPLE[ME];

  return (
    <>
      <AppShell
        brand={
          <>
            Pennant <span className="max-sm:hidden">engineering</span> notebook
          </>
        }
        sections={sections}
        sidebarLabel="Notebook pages"
        current={page?.id}
        onNavigate={(key) => open(key)}
        sidebarHeader={(rail) => <PageTreeHeader rail={rail} query={query} onQueryChange={setQuery} count={matches ? matches.size : null} onCreate={create} />}
        sidebarFooter={reset}
        storageKey={storageKey && `${storageKey}:layout`}
        actions={
          <>
            {actions}
            <DropdownMenu
              align="end"
              label={`Account: ${me.name}`}
              items={[
                { type: "label", label: `${me.name}, ${me.role.toLowerCase()}` },
                { label: "Settings", icon: Settings },
                { type: "separator" },
                { label: "Sign out", icon: LogOut },
              ]}
              trigger={(props) => (
                <button {...props} aria-label={`Account: ${me.name}`} className="flex cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring">
                  <Avatar name={me.name} size={28} />
                </button>
              )}
            />
          </>
        }
        className={cn("h-dvh", className)}
        mainClassName="flex overflow-hidden"
      >
        {page ? (
          <>
            <div ref={column} data-slot="notebook-page" className="flex min-w-0 flex-1 flex-col" onScrollCapture={track}
              onWheelCapture={byHand}
              onTouchMoveCapture={byHand}
              onPointerDownCapture={byHand}
              onKeyDownCapture={byHand}
            >
              <NotebookPageHeader
                page={page}
                words={words}
                now={now}
                titleRef={title}
                onTitleChange={(t) => update(page.id, { title: t })}
                onTitleEnter={() => editor.current?.focus()}
                onStatusChange={(s) => update(page.id, { status: s })}
                onDuplicate={() => duplicate(page)}
                onDelete={() => ask({ kind: "delete", page })}
                actions={<OutlineMenu entries={entries} current={current} onSelect={goTo} className="xl:hidden" />}
                columnClassName={COLUMN}
              />
              <MilkdownEditor
                key={page.id}
                editorRef={editor}
                aria-label={`${page.title || "Untitled"}: text`}
                value={page.body}
                onChange={(md) => md !== page.body && update(page.id, { body: md })}
                mode={mode}
                onModeChange={setMode}
                placeholder="Write, or type / for headings, tables, code and math"
                onUploadImage={fakeUpload}
                measure
                className="min-h-0 flex-1 border-0 has-[[data-milkdown-input]:focus-visible]:-outline-offset-2"
                contentClassName="min-h-0"
              />
            </div>
            <aside aria-label="Outline" className="hidden w-60 shrink-0 overflow-y-auto border-l border-border px-3 py-4 xl:block">
              <NotebookOutline entries={entries} current={current} onSelect={goTo} />
            </aside>
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title={pages.length ? "No page open" : "No pages yet"}
            description={pages.length ? "Choose a page from the notebook, or start a new one." : "The notebook is empty. Start a page."}
            actions={<NewPageMenu onCreate={create} className="w-auto" />}
            className="my-auto flex-1"
          />
        )}
      </AppShell>
      <AlertDialog
        open={asking}
        onClose={() => setAsking(false)}
        destructive
        title={confirm.kind === "delete" ? `Delete “${confirm.page.title || "Untitled"}”?` : "Reset the demo pages?"}
        description={
          confirm.kind === "delete"
            ? "It goes for good: the notebook has no bin. Reset demo pages brings back the pages it started with."
            : "Every page goes back to how it was, and pages you made are deleted."
        }
        confirmLabel={confirm.kind === "delete" ? "Delete page" : "Reset pages"}
        onConfirm={() => {
          if (confirm.kind === "delete") remove(confirm.page);
          else {
            setPages(initial);
            open(defaultPageId, true);
          }
        }}
      />
    </>
  );
}
