import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A docs page: title, a sentence or two under it, then the content in a reading-width column. */
export function DocsPage({ title, lead, eyebrow, children }: { title: ReactNode; lead?: ReactNode; eyebrow?: ReactNode; children: ReactNode }) {
  return (
    <article className="min-w-0 max-w-[880px] pb-8">
      {eyebrow && <p className="mb-1 text-[13px] text-muted-foreground">{eyebrow}</p>}
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
      {lead && <p className="mt-2 max-w-[70ch] text-[16px] text-muted-foreground">{lead}</p>}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </article>
  );
}

/** A section heading with an anchor, so sections can be linked to */
export function H2({ children, id }: { children: string; id?: string }) {
  const anchor = id ?? slug(children);
  return (
    <h2 id={anchor} className="mt-6 scroll-mt-4 border-b border-border pb-1 text-[20px] font-bold">
      <a href={`#${anchor}`} className="text-foreground no-underline hover:underline">
        {children}
      </a>
    </h2>
  );
}

export function H3({ children, id }: { children: string; id?: string }) {
  const anchor = id ?? slug(children);
  return (
    <h3 id={anchor} className="mt-3 scroll-mt-4 text-[16px] font-bold">
      {children}
    </h3>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-[72ch] leading-relaxed", className)}>{children}</p>;
}

/** Inline code */
export function C({ children }: { children: ReactNode }) {
  return <code className="border border-border bg-muted px-1 font-mono text-[13px]">{children}</code>;
}

/** A link in running text: the link colours, underlined, purple once visited */
export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-link underline underline-offset-2 visited:text-link-visited hover:decoration-2">
      {children}
    </a>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="ml-5 flex max-w-[72ch] list-disc flex-col gap-1 leading-relaxed marker:text-muted-foreground">{children}</ul>;
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="ml-6 flex max-w-[72ch] list-decimal flex-col gap-2 leading-relaxed marker:text-muted-foreground">{children}</ol>;
}

/** A plain bordered table for reference material */
export function RefTable({ head, rows, className }: { head: ReactNode[]; rows: ReactNode[][]; className?: string }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className={cn("border-collapse text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top", className)}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="border border-border bg-muted px-2 py-1 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A bordered box with a live component in it */
export function Preview({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto border border-border p-4", className)}>{children}</div>;
}
