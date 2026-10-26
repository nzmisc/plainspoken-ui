import { FileCode, FilePenLine, FileSpreadsheet, FileText, ListChecks, type Glyph } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import type { ChatArtifact, ChatArtifactKind, ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { parseCsv, type CreateDocumentInput, type DocumentToolOutput, type EditDocumentInput, type UpdateDocumentInput } from "@/registry/plainspoken/blocks/chat/artifacts";
import { ChatToolCard } from "@/registry/plainspoken/blocks/chat/tool-card";
import { Button } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

export const ARTIFACT_ICON: Record<ChatArtifactKind, Glyph> = { text: FileText, code: FileCode, sheet: FileSpreadsheet };

const LANGUAGE: Record<string, string> = { js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript", py: "Python", python: "Python", tsx: "TSX", jsx: "JSX", sql: "SQL", css: "CSS", html: "HTML", bash: "Bash", sh: "Shell", rust: "Rust", go: "Go" };
const languageName = (l?: string) => (l ? (LANGUAGE[l.toLowerCase()] ?? l) : "Code");

/** "Text, 312 words", "TypeScript, 42 lines", "Sheet, 6 rows and 4 columns" */
export function describeArtifact(kind: ChatArtifactKind | undefined, content: string, language?: string): string {
  if (kind === "code") {
    const lines = content ? content.split("\n").length : 0;
    return `${languageName(language)}, ${lines} ${lines === 1 ? "line" : "lines"}`;
  }
  if (kind === "sheet") {
    const rows = parseCsv(content);
    const body = Math.max(0, rows.length - 1);
    return `Sheet, ${body} ${body === 1 ? "row" : "rows"} and ${rows[0]?.length ?? 0} columns`;
  }
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return `Text, ${words} ${words === 1 ? "word" : "words"}`;
}

/** A few lines of the document, faded at the bottom */
/** The start of a Markdown text as plain lines: headings marked, list marks as bullets, the rest of the syntax gone */
function textPreview(md: string): { text: string; heading: boolean }[] {
  return md
    .split("\n")
    .filter((l) => l.trim() && !/^\s*(```|~~~|\|?\s*:?-{3,})/.test(l))
    .slice(0, 7)
    .map((l) => ({
      heading: /^\s{0,3}#{1,6}\s/.test(l),
      text: l
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^(\s*)[-*+]\s+(\[[ xX]\]\s+)?/, "$1• ")
        .replace(/^\s*>\s?/, "")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/(\*\*|__)(.+?)\1/g, "$2")
        .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, "$1$2")
        .replace(/(^|\W)_(?!\s)(.+?)_(?!\w)/g, "$1$2")
        .replace(/~~(.+?)~~/g, "$1")
        .replace(/`([^`]+)`/g, "$1"),
    }));
}

function Preview({ kind, content }: { kind?: ChatArtifactKind; content: string }) {
  if (!content.trim()) return null;
  if (kind === "sheet") {
    const rows = parseCsv(content).slice(0, 5);
    return (
      <table className="w-full table-fixed border-collapse text-[12px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === 0 ? "font-semibold" : undefined}>
              {r.slice(0, 5).map((c, j) => (
                <td key={j} className="truncate border border-border px-1.5 py-0.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <div aria-hidden className="relative max-h-28 overflow-hidden">
      {kind === "code" ? (
        <pre className="m-0 font-mono text-[12px] leading-[1.45] whitespace-pre-wrap">{content.split("\n").slice(0, 7).join("\n")}</pre>
      ) : (
        <div className="text-[12px] leading-[1.45]">
          {textPreview(content).map((l, i) => (
            <p key={i} className={cn("m-0", l.heading && "font-semibold")}>
              {l.text}
            </p>
          ))}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background" />
    </div>
  );
}

export interface ChatArtifactCardProps {
  /** The document tool's call: tool-createDocument, tool-updateDocument, tool-editDocument or tool-requestSuggestions */
  part: ChatPart;
  /** The document it made or changed, once it is done */
  artifact?: ChatArtifact;
  /** Open the document in the panel: by its id (and the version this call made), or while it is written, by the call */
  onOpen?: (target: { id?: string; callId: string; version?: number }) => void;
  /** This document is open in the panel now */
  active?: boolean;
  className?: string;
}

/**
 * A document tool's call in an answer. A new document shows as a card with its kind, title, size
 * and first lines, and Open; while the model is still writing it, the card says so and its lines
 * come in as they are written. A change to a document is a line saying what changed and which
 * version it made; suggestions say how many there are, to review in the panel. A call that
 * failed shows why, as a tool card.
 */
export function ChatArtifactCard({ part, artifact, onOpen, active = false, className }: ChatArtifactCardProps) {
  const tool = part.type.slice("tool-".length);
  const callId = part.toolCallId ?? "";
  const running = part.state === "input-streaming" || part.state === "input-available";
  const out = (part.output ?? null) as DocumentToolOutput | null;
  if (part.state === "output-error" || out?.error) {
    return <ChatToolCard name={tool} title="A document couldn't be changed" state="output-error" errorText={part.errorText ?? out?.error} input={part.input} icon={FilePenLine} className={className} />;
  }

  if (tool === "createDocument") {
    const input = (part.input ?? {}) as CreateDocumentInput;
    const kind = artifact?.kind ?? input.kind;
    const title = artifact?.title ?? input.title ?? "a document";
    const content = artifact?.versions[0]?.content ?? input.content ?? "";
    const icon = kind ? ARTIFACT_ICON[kind] : FileText;
    return (
      <section
        data-slot="chat-artifact-card"
        data-active={active || undefined}
        aria-label={`Document: ${title}`}
        aria-busy={running || undefined}
        className={cn("max-w-xl border bg-background", active ? "border-foreground" : "border-border", className)}
      >
        <header className="flex min-h-9 items-center gap-2 border-b border-border px-2 py-1">
          <Icon icon={icon} size={16} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="truncate text-[14px] font-semibold">{running ? `Writing “${title}”…` : title}</h3>
            <p className="truncate text-[12px] text-muted-foreground">{running ? (kind ? describeArtifact(kind, content, input.language) : "Starting…") : describeArtifact(kind, content, artifact?.language)}</p>
          </div>
          {running && <Spinner label={null} className="text-muted-foreground" />}
          {onOpen && (
            <Button size="sm" variant={active ? "secondary" : "default"} onClick={() => onOpen({ id: artifact?.id ?? out?.id, callId, version: 0 })}>
              {active ? "Open" : running ? "Watch" : "Open"}
            </Button>
          )}
        </header>
        {onOpen ? (
          <button type="button" tabIndex={-1} onClick={() => onOpen({ id: artifact?.id ?? out?.id, callId, version: 0 })} className={cn("block w-full cursor-pointer px-2 py-1.5 text-left hover:bg-secondary/60", FOCUS_RING)}>
            <Preview kind={kind} content={content} />
          </button>
        ) : (
          <div className="px-2 py-1.5">
            <Preview kind={kind} content={content} />
          </div>
        )}
      </section>
    );
  }

  // A change: one line
  const title = artifact?.title ?? "a document";
  const id = artifact?.id ?? out?.id ?? (part.input as { id?: string } | undefined)?.id;
  let text: string;
  let icon: Glyph = FilePenLine;
  if (tool === "requestSuggestions") {
    icon = ListChecks;
    text = running ? `Reading “${title}” for suggestions…` : `${out?.kept ?? 0} ${out?.kept === 1 ? "suggestion" : "suggestions"} for “${title}”`;
  } else {
    const note = ((part.input ?? {}) as UpdateDocumentInput & EditDocumentInput).note;
    text = running ? `${tool === "editDocument" ? "Editing" : "Rewriting"} “${title}”…` : `${tool === "editDocument" ? "Edited" : "Updated"} “${title}”${note ? `: ${note}` : ""}`;
  }
  return (
    <div data-slot="chat-artifact-card" className={cn("flex max-w-xl min-h-9 items-center gap-2 border border-border bg-background px-2 py-1 text-[13px]", className)}>
      <Icon icon={icon} size={15} className="shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">
        {text}
        {!running && out?.version != null && tool !== "requestSuggestions" && <span className="text-muted-foreground">, version {out.version}</span>}
      </span>
      {running && <Spinner label={null} className="text-muted-foreground" />}
      {onOpen && id && (
        <Button size="sm" variant="ghost" onClick={() => onOpen({ id, callId, version: tool === "requestSuggestions" || out?.version == null ? undefined : out.version - 1 })}>
          {tool === "requestSuggestions" ? "Review" : "Open"}
        </Button>
      )}
    </div>
  );
}
