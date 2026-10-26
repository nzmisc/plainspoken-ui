"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, ListChecks, MessageSquareText, Pencil, Play, Square, Terminal, WandSparkles, X } from "@/registry/plainspoken/lib/icons";
import type { ChatArtifact, ChatConsoleLine, ChatEditSuggestion } from "@/registry/plainspoken/blocks/chat/data";
import {
  artifactFileName,
  artifactMediaType,
  openSuggestions,
  parseCsv,
  resolveSuggestion,
  restoreVersion,
  runnable,
  toCsv,
  withYourEdit,
  type ArtifactDraft,
} from "@/registry/plainspoken/blocks/chat/artifacts";
import { downloadText } from "@/registry/plainspoken/blocks/chat/attachments";
import { ARTIFACT_ICON, describeArtifact } from "@/registry/plainspoken/blocks/chat/artifact-card";
import { runCode } from "@/registry/plainspoken/blocks/chat/code-runner";
import { ChatCodeBlock, ChatMarkdown } from "@/registry/plainspoken/blocks/chat/markdown";
import { ChatVersionFooter } from "@/registry/plainspoken/blocks/chat/version-footer";
import { diff as diffText, type DiffPart } from "@/registry/plainspoken/lib/diff";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Diff, DiffLegend, DiffText } from "@/registry/plainspoken/ui/diff";
import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

type Row = Record<string, string | number | null> & { _id: string };

const NUMBER = /^-?\d+(\.\d+)?$/;

/** A sheet's CSV as rows and columns for EditableTable: a column of plain numbers is a number column */
function sheetOf(csv: string): { columns: EditableColumn<Row>[]; rows: Row[] } {
  const [head = [], ...body] = parseCsv(csv);
  const columns = head.map((h, i): EditableColumn<Row> => {
    const values = body.map((r) => r[i]?.trim() ?? "").filter(Boolean);
    const numeric = values.length > 0 && values.every((v) => NUMBER.test(v));
    const decimals = numeric ? Math.max(0, ...values.map((v) => v.split(".")[1]?.length ?? 0)) : undefined;
    return { key: `c${i}`, header: h || `Column ${i + 1}`, type: numeric ? "number" : "text", decimals, width: numeric ? 96 : Math.min(260, Math.max(110, ...values.map((v) => v.length * 7.5))) };
  });
  const rows = body.map((r, n) => {
    const row: Row = { _id: `r${n}` };
    columns.forEach((c, i) => {
      const v = r[i] ?? "";
      row[c.key] = c.type === "number" ? (v.trim() === "" ? null : Number(v)) : v;
    });
    return row;
  });
  return { columns, rows };
}

function csvOf(columns: EditableColumn<Row>[], rows: Row[]): string {
  return toCsv([columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => (r[c.key] == null ? "" : String(r[c.key]))))]);
}

let nextRow = 0;

/** The sheet, editable while it is the latest version: each change is your edit, kept as one version until the model makes another */
function SheetEditor({ csv, title, editable, onEdit, className }: { csv: string; title: string; editable: boolean; onEdit: (csv: string) => void; className?: string }) {
  const initial = useMemo(() => sheetOf(csv), [csv]);
  const [rows, setRows] = useState(initial.rows);
  // The CSV this editor last wrote: anything else coming in (a new version from the model) starts it again
  const wrote = useRef(csv);
  useEffect(() => {
    if (csv !== wrote.current) {
      wrote.current = csv;
      setRows(initial.rows);
    }
  }, [csv, initial.rows]);
  if (!initial.columns.length) return <p className="p-3 text-muted-foreground">This sheet is empty.</p>;
  return (
    <EditableTable<Row>
      label={title}
      columns={initial.columns}
      value={rows}
      rowKey={(r) => r._id}
      readOnly={!editable}
      newRow={editable ? (copy) => ({ ...(copy ?? Object.fromEntries(initial.columns.map((c) => [c.key, c.type === "number" ? null : ""]))), _id: `n${nextRow++}` }) : undefined}
      onChange={(next) => {
        setRows(next);
        const out = csvOf(initial.columns, next);
        wrote.current = out;
        onEdit(out);
      }}
      toolbar={editable}
      hint={false}
      maxHeight="none"
      className={className}
    />
  );
}

/** A removed passage and the one put in its place, with a space between, so they don't read as one word */
const spaced = (parts: DiffPart[]): DiffPart[] => parts.flatMap((p, i) => (p.op === "insert" && parts[i - 1]?.op === "delete" ? [{ op: "equal", text: " " }, p] : [p]));

function Suggestions({ items, onResolve, onAll, busy }: { items: ChatEditSuggestion[]; onResolve: (id: string, accept: boolean) => void; onAll: () => void; busy: boolean }) {
  if (!items.length) return null;
  return (
    <section aria-label="Suggestions" className="border-b border-border bg-muted/40 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <h3 className="flex-1 text-[13px] font-semibold">
          {items.length} {items.length === 1 ? "suggestion" : "suggestions"}
        </h3>
        {items.length > 1 && (
          <Button size="sm" icon={Check} disabled={busy} onClick={onAll}>
            Accept all
          </Button>
        )}
      </div>
      <ol className="flex flex-col gap-1.5">
        {items.map((s) => (
          <li key={s.id} className="border border-border bg-background px-2 py-1.5 text-[13px]">
            <p className="leading-relaxed">
              <DiffText parts={spaced(diffText(s.original, s.replacement))} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 text-[12px] text-muted-foreground">{s.reason}</p>
              <span className="ctl-xs flex gap-1">
                <Button variant="primary" icon={Check} disabled={busy} onClick={() => onResolve(s.id, true)}>
                  Accept
                </Button>
                <Button icon={X} disabled={busy} onClick={() => onResolve(s.id, false)}>
                  Reject
                </Button>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const LINE: Record<ChatConsoleLine["level"], string> = {
  log: "",
  info: "text-link",
  warn: "text-warning",
  error: "text-destructive",
  result: "text-muted-foreground",
};

function Console({ lines, status, note }: { lines: ChatConsoleLine[]; status: string; note?: string }) {
  return (
    <section aria-label="Console" className="border-t border-border">
      <h3 className="flex min-h-7 items-center gap-1.5 border-b border-border bg-muted px-2 text-[12px] font-semibold text-muted-foreground">
        <Icon icon={Terminal} size={13} />
        Console
        <span className="font-normal" aria-live="polite">
          {status}
        </span>
      </h3>
      <pre className="m-0 max-h-56 overflow-auto px-2 py-1.5 font-mono text-[12px] leading-[1.5] whitespace-pre" tabIndex={0}>
        {lines.length === 0 ? <span className="text-muted-foreground">{note ?? "Nothing was written to the console."}</span> : lines.map((l, i) => <div key={i} className={cn(LINE[l.level])}>{l.text}</div>)}
      </pre>
    </section>
  );
}

/** Buttons that ask the model to change the document, by kind */
function quickActions(a: ChatArtifact, lastError?: string): { label: string; icon?: typeof Pencil; prompt: string }[] {
  const ref = `“${a.title}” (id ${a.id})`;
  if (a.kind === "text")
    return [
      { label: "Polish", icon: WandSparkles, prompt: `Polish the document ${ref}: fix the grammar and smooth the wording, keeping its meaning and length. Use updateDocument.` },
      { label: "Suggest edits", icon: ListChecks, prompt: `Suggest improvements to the document ${ref}, with requestSuggestions.` },
      { label: "Shorter", prompt: `Make the document ${ref} about a third shorter, keeping what matters. Use updateDocument.` },
      { label: "Simpler", prompt: `Rewrite the document ${ref} in simpler words, for someone new to the subject. Use updateDocument.` },
    ];
  if (a.kind === "code")
    return [
      ...(lastError ? [{ label: "Fix the error", icon: WandSparkles, prompt: `Running ${ref} gave this error:\n\n${lastError}\n\nFix it with updateDocument.` }] : []),
      { label: "Add comments", prompt: `Add short comments to the code in ${ref} where they help a reader. Use updateDocument.` },
      { label: "Add logs", prompt: `Add console.log lines to ${ref} that show what it does as it runs. Use updateDocument.` },
      { label: "Explain", icon: MessageSquareText, prompt: `Explain how the code in ${ref} works, step by step, in the chat. Don't change it.` },
    ];
  return [
    { label: "Add totals", prompt: `Add a totals row to the sheet ${ref}, with updateDocument.` },
    { label: "Explain", icon: MessageSquareText, prompt: `What stands out in the sheet ${ref}? Answer in the chat, briefly. Don't change it.` },
  ];
}

export interface ChatArtifactPanelProps {
  /** The document open; null while a new one is still being written (see `draft`) */
  artifact: ChatArtifact | null;
  /** What the model is writing into it right now, as it arrives */
  draft?: ArtifactDraft | null;
  /** The version shown, from 0; leave out to follow the latest */
  index?: number;
  onIndexChange?: (index: number | undefined) => void;
  /** The document with your change: an accepted suggestion, an edit, a restored version, a run */
  onChange?: (next: ChatArtifact) => void;
  /** Ask the model for something about the document (the quick actions): sent as your next message */
  onAsk?: (prompt: string) => void;
  /** An answer is coming in: the quick actions wait */
  busy?: boolean;
  onClose: () => void;
  /** The time to stamp your edits with; the default is now */
  now?: () => number;
  className?: string;
}

/**
 * A document beside the conversation, made by the model with its tools: writing (Markdown), code,
 * or a sheet. The header has its title, Copy, Download and (for JavaScript and TypeScript) Run,
 * whose console output shows under the code; quick actions under it ask the model for a common
 * change (polish, suggestions, shorter; comments and logs; totals). Writing can be edited by hand
 * and has the model's suggestions to accept or reject; a sheet is edited in place like a
 * spreadsheet. Every version is kept: the footer steps through them, shows what each changed, and
 * restores an older one. While the model writes, its words stream into the panel.
 */
export function ChatArtifactPanel({ artifact, draft, index, onIndexChange, onChange, onAsk, busy = false, onClose, now = Date.now, className }: ChatArtifactPanelProps) {
  const [diff, setDiff] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [live, setLive] = useState<{ lines: ChatConsoleLine[]; running: boolean } | null>(null);
  const stop = useRef<AbortController | null>(null);
  useEffect(() => () => stop.current?.abort(), []);

  const versions = artifact?.versions ?? [];
  const shown = index != null && index < versions.length ? index : versions.length - 1;
  const latest = shown === versions.length - 1;
  const writing = !!draft && draft.content != null && (draft.tool === "createDocument" || draft.tool === "updateDocument");
  const kind = artifact?.kind ?? draft?.kind ?? "text";
  const title = artifact?.title ?? draft?.title ?? "New document";
  const language = artifact?.language ?? draft?.language;
  const content = writing ? (draft!.content ?? "") : (versions[shown]?.content ?? "");
  const previous = shown > 0 ? versions[shown - 1]?.content : undefined;
  const showDiff = diff && !writing && previous != null;
  const run = runnable(language);
  const lastRun = artifact?.run;
  const lastError = lastRun?.status === "error" ? lastRun.lines.find((l) => l.level === "error")?.text : undefined;
  const pending = artifact && latest && !writing ? openSuggestions(artifact) : [];
  const fileName = artifactFileName({ title, kind, language });

  const change = (next: ChatArtifact) => onChange?.(next);
  const startRun = () => {
    if (!artifact || !run) return;
    stop.current?.abort();
    const ctrl = new AbortController();
    stop.current = ctrl;
    const lines: ChatConsoleLine[] = [];
    setLive({ lines, running: true });
    const onLine = (l: ChatConsoleLine) => {
      lines.push(l);
      setLive({ lines: [...lines], running: true });
    };
    void runCode(content, run, { signal: ctrl.signal, onLine }).then((r) => {
      if (ctrl.signal.aborted) return;
      setLive(null);
      change({ ...artifact, run: { ...r, version: shown } });
    });
  };
  const runStatus = live?.running
    ? "Running…"
    : lastRun
      ? `${lastRun.status === "timeout" ? "stopped at the time limit" : lastRun.status === "error" ? "ended with an error" : "finished"}, version ${lastRun.version + 1}, ${lastRun.ms} ms`
      : "";

  return (
    <aside data-slot="chat-artifact-panel" aria-label={`Document: ${title}`} className={cn("flex min-h-0 min-w-0 flex-col bg-background", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <Icon icon={ARTIFACT_ICON[kind]} size={18} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="truncate text-[15px] font-bold">{title}</h2>
          <p className="truncate text-[12px] text-muted-foreground" aria-live="polite">
            {writing ? (
              <Spinner label={null} className="inline-flex">
                {draft!.tool === "createDocument" ? "Writing…" : `Writing version ${versions.length + 1}…`}
              </Spinner>
            ) : (
              describeArtifact(kind, content, language)
            )}
          </p>
        </div>
        <div className="ctl-sm flex shrink-0 items-center gap-1">
          {kind === "code" &&
            (live?.running ? (
              <Button icon={Square} onClick={() => stop.current?.abort()}>
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Play}
                disabled={!run || writing || !artifact}
                onClick={startRun}
                title={run ? "Run it in the browser, in a sandbox with no network, for up to 5 seconds" : "Only JavaScript and TypeScript run here"}
              >
                Run
              </Button>
            ))}
          {kind === "text" && onChange && artifact && !writing && latest && editing == null && (
            <IconButton variant="ghost" icon={Pencil} label="Edit the document" disabled={busy} onClick={() => setEditing(content)} />
          )}
          <CopyButton text={content} name={title} size="sm" />
          <IconButton variant="ghost" icon={Download} label={`Download ${fileName}`} disabled={!content} onClick={() => downloadText(content, fileName, artifactMediaType({ kind }))} />
          <IconButton variant="ghost" icon={X} label="Close the document" onClick={onClose} />
        </div>
      </header>

      {onAsk && artifact && !writing && latest && editing == null && (
        <div role="toolbar" aria-label="Ask the model" className="ctl-sm flex shrink-0 flex-wrap items-center gap-1 border-b border-border px-2 py-1">
          {quickActions(artifact, lastError).map((q) => (
            <Button key={q.label} variant="ghost" icon={q.icon} disabled={busy} onClick={() => onAsk(q.prompt)}>
              {q.label}
            </Button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto" tabIndex={-1}>
        {editing != null ? (
          <form
            className="flex h-full flex-col gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (artifact) change(withYourEdit(artifact, editing, "Your edit", now()));
              setEditing(null);
              onIndexChange?.(undefined);
            }}
          >
            <Textarea aria-label={`Edit ${title}`} value={editing} onChange={(e) => setEditing(e.target.value)} className="min-h-80 flex-1 font-mono text-[13px] leading-[1.5]" autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={editing === content}>
                Save as a new version
              </Button>
            </div>
          </form>
        ) : showDiff ? (
          <div className="flex flex-col gap-2 p-3">
            <DiffLegend />
            <Diff before={previous} after={content} granularity={kind === "text" ? "word" : "line"} className={cn(kind !== "text" && "font-mono text-[13px]")} />
          </div>
        ) : kind === "text" ? (
          <>
            {artifact && <Suggestions busy={busy} items={pending} onResolve={(id, accept) => change(resolveSuggestion(artifact, id, accept, now()))} onAll={() => change(pending.reduce((a, s) => resolveSuggestion(a, s.id, true, now()), artifact))} />}
            <ChatMarkdown streaming={writing} className="px-4 py-3">
              {content}
            </ChatMarkdown>
          </>
        ) : kind === "code" ? (
          <ChatCodeBlock bare code={content} language={language} streaming={writing} fullscreen={false} className="font-mono text-[13px] [&_pre]:min-h-full" />
        ) : writing ? (
          <ChatMarkdown streaming className="px-3 py-2">
            {sheetPreview(content)}
          </ChatMarkdown>
        ) : (
          <SheetEditor className="p-2" csv={content} title={title} editable={latest && !!onChange && !!artifact} onEdit={(csv) => artifact && change(withYourEdit(artifact, csv, "Your edits", now()))} />
        )}
      </div>

      {kind === "code" && (live || lastRun || (artifact && !run)) && (
        <Console
          lines={live?.lines ?? lastRun?.lines ?? []}
          status={runStatus}
          note={!run ? `${language ? language[0].toUpperCase() + language.slice(1) : "This language"} can't run here: only JavaScript and TypeScript run in the browser.` : undefined}
        />
      )}

      {artifact && versions.length > 0 && !writing && (
        <ChatVersionFooter
          versions={versions}
          index={shown}
          onIndexChange={(i) => {
            setEditing(null);
            onIndexChange?.(i === versions.length - 1 ? undefined : i);
          }}
          diff={showDiff}
          onDiffChange={setDiff}
          onRestore={onChange ? (i) => (change(restoreVersion(artifact, i, now())), onIndexChange?.(undefined)) : undefined}
          busy={busy}
        />
      )}
    </aside>
  );
}

/** A sheet still being written, as a Markdown table, so it draws as it arrives */
function sheetPreview(csv: string): string {
  const rows = parseCsv(csv);
  if (!rows.length) return "";
  const esc = (c: string) => c.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [`| ${rows[0].map(esc).join(" | ")} |`, `| ${rows[0].map(() => "---").join(" | ")} |`, ...rows.slice(1).map((r) => `| ${r.map(esc).join(" | ")} |`)].join("\n");
}
