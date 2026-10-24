"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Input } from "@/registry/plainspoken/ui/input";
import { fontStack, fontVar, type FontChoice, type ThemeOptions } from "@/lib/theme";

/** Code to copy: a title bar with a copy button over a scrolling <pre>. Plain, no highlighting (it changes as you pick). */
export function CodeOut({ title, code, copyLabel, maxHeight }: { title: string; code: string; copyLabel: string; maxHeight?: boolean }) {
  return (
    <div className="min-w-0 border border-border text-[13px]">
      <div className="flex min-h-7 items-center justify-between gap-2 border-b border-border bg-muted pr-0.5 pl-2">
        <span className="font-mono text-[12px] text-muted-foreground">{title}</span>
        <CopyButton text={code} label={copyLabel} size="xs" />
      </div>
      <pre
        tabIndex={0}
        aria-label={title}
        className={`overflow-x-auto bg-muted/40 px-3 py-2 font-mono text-[12px] leading-[1.55] ${maxHeight ? "max-h-[360px] overflow-y-auto" : ""}`}
      >
        {code}
      </pre>
    </div>
  );
}

/** A one-line shell command with a copy button, like the docs' */
export function CommandOut({ command }: { command: string }) {
  return (
    <div className="flex min-h-8 min-w-0 items-center gap-2 border border-border bg-muted/40 py-1 pr-1 pl-3 font-mono text-[13px]">
      <span aria-hidden className="text-muted-foreground select-none">
        $
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <CopyButton text={command} />
    </div>
  );
}

/** "ibm-plex-sans" → "ibmPlexSans" */
const ident = (f: FontChoice) => f.id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** The next/font/google lines for the chosen fonts; null when both are system fonts */
export function fontSnippet(o: ThemeOptions): string | null {
  const fonts = [o.sans, o.mono].filter((f) => f.google);
  if (!fonts.length) return null;
  const names = fonts.map((f) => f.google!).join(", ");
  const decl = fonts.map((f) => {
    const opts = [`subsets: ["latin"]`, f.weights ? `weight: [${f.weights.map((w) => `"${w}"`).join(", ")}]` : null, `variable: "${fontVar(f)}"`].filter(Boolean);
    return `const ${ident(f)} = ${f.google}({ ${opts.join(", ")} });`;
  });
  const classes = fonts.map((f) => `\${${ident(f)}.variable}`).join(" ");
  return `import { ${names} } from "next/font/google";

${decl.join("\n")}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`${classes}\`}>
      <body>{children}</body>
    </html>
  );
}`;
}

/** The two @theme lines that point Tailwind's font-sans and font-mono at the loaded fonts */
export function fontCss(o: ThemeOptions): string {
  return `@theme inline {
  --font-sans: ${fontStack(o.sans.stack, fontVar(o.sans))};
  --font-mono: ${fontStack(o.mono.stack, fontVar(o.mono))};
}`;
}

/** The share link: the customizer's own address, read-only, with a copy button */
export function ShareLink({ url, label }: { url: string; label: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[14px] font-medium">{label}</span>
      <Input readOnly value={url} inputClassName="font-mono text-[12px]" onFocus={(e) => e.currentTarget.select()} suffix={<CopyButton text={url} />} />
    </label>
  );
}
