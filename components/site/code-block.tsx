import { highlight } from "@/lib/highlight";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  code: string;
  lang?: string;
  /** A file name or label shown above the code */
  title?: string;
  className?: string;
  /** Cap the height and scroll inside (long source files) */
  maxHeight?: boolean;
}

/** Highlighted code with a copy button, scrolling sideways rather than wrapping. */
export async function CodeBlock({ code, lang = "tsx", title, className, maxHeight }: CodeBlockProps) {
  const html = await highlight(code.trimEnd(), lang);
  return (
    <div className={cn("relative border border-border bg-muted/40 text-[13px]", className)}>
      <div className="flex min-h-7 items-center justify-between gap-2 border-b border-border bg-muted px-2">
        <span className="font-mono text-[12px] text-muted-foreground">{title ?? lang}</span>
        <CopyButton text={code.trimEnd()} />
      </div>
      <div
        className={cn("overflow-x-auto px-3 py-2 leading-[1.55] [&_pre]:bg-transparent!", maxHeight && "max-h-[480px] overflow-y-auto")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/** A one-line shell command with a copy button */
export function Command({ children }: { children: string }) {
  return (
    <div className="flex min-h-8 items-center gap-2 border border-border bg-muted/40 py-1 pr-1 pl-3 font-mono text-[13px]">
      <span aria-hidden className="text-muted-foreground select-none">
        $
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{children}</code>
      <CopyButton text={children} />
    </div>
  );
}
