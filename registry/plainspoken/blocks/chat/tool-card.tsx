import type { ReactNode } from "react";
import { ChevronRight, CircleCheck, CircleX, Image, Puzzle, type Glyph } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Spinner } from "@/registry/plainspoken/ui/spinner";
import { cn } from "@/lib/utils";

/** Where a tool call is: its input being written, running, done, or failed */
export type ChatToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

/** Titles and icons for the tools people meet often; any other is named from its own name */
const KNOWN: Record<string, { title: string; icon: Glyph }> = {
  generateImage: { title: "Image generation", icon: Image },
};

/** A tool's name for people: "Image generation" for generateImage, "Look up tide" for lookUpTide */
export function toolTitle(name: string): string {
  if (KNOWN[name]) return KNOWN[name].title;
  const words = name.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : name;
}

/** A tool's icon: its own when known, otherwise a puzzle piece */
export const toolIcon = (name: string): Glyph => KNOWN[name]?.icon ?? Puzzle;

const STATUS: Record<ChatToolState, string> = {
  "input-streaming": "Preparing…",
  "input-available": "Running…",
  "output-available": "Done",
  "output-error": "Failed",
};

/** JSON for people: indented, long strings and long lists cut short */
function pretty(v: unknown): string {
  const seen = new WeakSet<object>();
  const text = JSON.stringify(
    v,
    (_, x: unknown) => {
      if (typeof x === "string" && x.length > 400) return `${x.slice(0, 400)}… (${x.length.toLocaleString("en")} characters)`;
      if (x && typeof x === "object") {
        if (seen.has(x)) return "[…]";
        seen.add(x);
        if (Array.isArray(x) && x.length > 20) return [...x.slice(0, 20), `… ${x.length - 20} more`];
      }
      return x;
    },
    2,
  );
  return text ?? String(v);
}

export interface ChatToolCardProps {
  /** The tool's name as the model called it: "getWeather" */
  name: string;
  /** What the call is, in words: "Weather in Lisbon". Default: the name. */
  title?: ReactNode;
  state: ChatToolState | (string & {});
  /** What the model passed; shown under Details */
  input?: unknown;
  /** What the tool gave back; shown under Details */
  output?: unknown;
  /** Why it failed */
  errorText?: string;
  icon?: Glyph;
  /** Shown in the card under the title: a result drawn properly, rather than as JSON */
  children?: ReactNode;
  /** Leave out the Details with the raw input and output */
  hideDetails?: boolean;
  className?: string;
}

/**
 * A tool call in an answer, as a card: the tool's icon and what it does, and how far it has got
 * (preparing, running with a spinner, done, failed with the reason). Details folds out the input
 * the model wrote and the output it got back, as JSON. Tools with a result of their own to show
 * (the weather, a document) put it in the card's body.
 */
export function ChatToolCard({ name, title, state, input, output, errorText, icon = Puzzle, children, hideDetails = false, className }: ChatToolCardProps) {
  const running = state === "input-streaming" || state === "input-available";
  const failed = state === "output-error";
  const status = STATUS[state as ChatToolState] ?? state;
  return (
    <section
      data-slot="chat-tool-card"
      data-state={state}
      aria-label={`Tool: ${name}`}
      aria-busy={running || undefined}
      className={cn("border bg-background text-[13px]", failed ? "border-destructive/60" : "border-border", className)}
    >
      <header className="flex min-h-8 items-center gap-2 px-2 py-1">
        <Icon icon={icon} size={15} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">
          <span className="font-semibold">{title ?? name}</span>
          {title != null && <span className="ml-1.5 font-mono text-[12px] text-muted-foreground">{name}</span>}
        </span>
        <span className={cn("flex shrink-0 items-center gap-1 text-[12px]", failed ? "text-destructive" : "text-muted-foreground")}>
          {running ? <Spinner label={null} /> : <Icon icon={failed ? CircleX : CircleCheck} size={13} className={failed ? undefined : "text-success"} />}
          {status}
        </span>
      </header>
      {failed && errorText && <p className="border-t border-border px-2 py-1.5 text-destructive">{errorText}</p>}
      {children != null && children !== false && <div className="border-t border-border">{children}</div>}
      {!hideDetails && (input !== undefined || output !== undefined) && (
        <details className="group/details border-t border-border">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-1 px-2 py-1 text-[12px] text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden",
              FOCUS_RING,
              "focus-visible:-outline-offset-2",
            )}
          >
            <Icon icon={ChevronRight} size={13} className="transition-transform group-open/details:rotate-90 motion-reduce:transition-none" />
            Details
          </summary>
          <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
            {input !== undefined && (
              <div className="min-w-0">
                <h4 className="mb-0.5 text-[12px] font-semibold text-muted-foreground">Input</h4>
                <pre className="max-h-60 overflow-auto border border-border bg-muted/40 px-2 py-1 font-mono text-[12px] whitespace-pre-wrap">{pretty(input)}</pre>
              </div>
            )}
            {output !== undefined && (
              <div className="min-w-0">
                <h4 className="mb-0.5 text-[12px] font-semibold text-muted-foreground">Output</h4>
                <pre className="max-h-60 overflow-auto border border-border bg-muted/40 px-2 py-1 font-mono text-[12px] whitespace-pre-wrap">{pretty(output)}</pre>
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
