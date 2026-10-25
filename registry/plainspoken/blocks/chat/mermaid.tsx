"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { TriangleAlert } from "@/registry/plainspoken/lib/icons";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

// Mermaid is big, so it is fetched (through Streamdown's mermaid plugin) the first time a diagram
// is drawn, not with the page. Its "base" theme takes the colours from the theme tokens as they are
// when it draws, and it draws again when the page switches between light and dark.

type Plugin = Awaited<typeof import("@streamdown/mermaid")>["mermaid"];
let plugin: Promise<Plugin> | null = null;
const loadMermaid = () => (plugin ??= import("@streamdown/mermaid").then((m) => m.mermaid));

/** Any change to <html>'s class or style (the .dark class, a theme switch) */
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", onChange);
  };
}
const themeKey = () => `${document.documentElement.className}|${matchMedia("(prefers-color-scheme: dark)").matches}`;

/** A theme token as #rrggbb: mermaid computes shades itself and can't read oklch() */
function tokenHex(name: string, ctx: CanvasRenderingContext2D): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = getComputedStyle(probe).color;
  probe.remove();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const canvas = () => document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;

/**
 * Theme tokens in the source, as `classDef done fill:var(--background),stroke:var(--chart-2)`,
 * become their colours now (Mermaid's parser would read the "--" as an arrow)
 */
function withTokens(code: string): string {
  if (!code.includes("var(--")) return code;
  const ctx = canvas();
  return code.replace(/var\(--([\w-]+)\)/g, (_, name: string) => tokenHex(`--${name}`, ctx));
}

function themeConfig() {
  const ctx = canvas();
  const t = (name: string) => tokenHex(name, ctx);
  const [bg, fg, muted, mutedFg, border, accent] = ["--background", "--foreground", "--muted", "--muted-foreground", "--border", "--accent"].map(t);
  const charts = [1, 2, 3, 4, 5].map((n) => t(`--chart-${n}`));
  const dark = document.documentElement.classList.contains("dark");
  return {
    theme: "base" as const,
    darkMode: dark,
    fontFamily: getComputedStyle(document.body).fontFamily,
    themeVariables: {
      darkMode: dark,
      fontFamily: getComputedStyle(document.body).fontFamily,
      fontSize: "14px",
      background: bg,
      textColor: fg,
      primaryColor: muted,
      primaryTextColor: fg,
      primaryBorderColor: mutedFg,
      secondaryColor: accent,
      secondaryTextColor: fg,
      secondaryBorderColor: mutedFg,
      tertiaryColor: bg,
      tertiaryTextColor: fg,
      tertiaryBorderColor: border,
      mainBkg: muted,
      nodeBorder: mutedFg,
      lineColor: mutedFg,
      clusterBkg: bg,
      clusterBorder: border,
      edgeLabelBackground: bg,
      noteBkgColor: accent,
      noteTextColor: fg,
      noteBorderColor: border,
      actorBkg: muted,
      actorBorder: mutedFg,
      actorTextColor: fg,
      signalColor: fg,
      signalTextColor: fg,
      labelBoxBkgColor: muted,
      labelBoxBorderColor: mutedFg,
      ...Object.fromEntries(charts.flatMap((c, i) => [[`pie${i + 1}`, c], [`cScale${i}`, c]])),
    },
    // Square corners, like everything else
    themeCSS: "rect, .label-container, .basic.label-container { rx: 0 !important; ry: 0 !important; }",
  };
}

type State = { key: string; svg: string } | { key: string; error: string } | null;

export interface ChatMermaidProps {
  /** The diagram's Mermaid source */
  code: string;
  className?: string;
}

/**
 * A Mermaid diagram in an answer: a label bar with a copy button for the source, over the
 * diagram drawn in the theme's colours and font with square boxes, centred, and scrolling sideways
 * when it is wider than the column. Styles in the source may use the theme's tokens
 * (`classDef done stroke:var(--chart-2)`). Until it is drawn the source shows; if Mermaid can't
 * read it, the source stays with one line saying why.
 */
export function ChatMermaid({ code, className }: ChatMermaidProps) {
  const id = `chat-mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const theme = useSyncExternalStore(subscribeTheme, themeKey, () => "");
  const [state, setState] = useState<State>(null);
  const key = `${theme}\n${code}`;

  useEffect(() => {
    if (!theme) return;
    let live = true;
    loadMermaid()
      // SVG text labels rather than HTML ones: Prose's paragraph spacing can't reach into those.
      // Tighter spacing than Mermaid's, as everything here is dense.
      .then((p) =>
        p
          .getMermaid({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, htmlLabels: false, flowchart: { htmlLabels: false, nodeSpacing: 32, rankSpacing: 36 }, ...themeConfig() })
          .render(id, withTokens(code)),
      )
      .then(
        ({ svg }) => live && setState({ key, svg: naturalWidth(svg) }),
        (e: unknown) => {
          // Mermaid leaves its scratch element behind when it fails
          document.getElementById(`d${id}`)?.remove();
          if (live) setState({ key, error: (e instanceof Error ? e.message : String(e)).split("\n")[0] });
        },
      );
    return () => {
      live = false;
    };
  }, [id, code, key, theme]);

  // The last drawing stays up while a new one (another theme) is being made
  const shown = state && "svg" in state ? state.svg : null;
  const error = state && "error" in state && state.key === key ? state.error : null;
  return (
    <figure data-slot="chat-mermaid" aria-label="Diagram" className={cn("mb-[0.75em] border border-border last:mb-0", className)}>
      <div className="flex min-h-7 items-center justify-between gap-2 border-b border-border bg-muted pr-0.5 pl-2 font-sans">
        <span className="truncate font-mono text-[12px] text-muted-foreground">mermaid</span>
        <CopyButton text={code} name="diagram source" />
      </div>
      {shown && !error ? (
        <div className="overflow-x-auto p-3">
          <div className="mx-auto w-max" dangerouslySetInnerHTML={{ __html: shown }} />
        </div>
      ) : (
        <>
          <pre className="m-0! overflow-x-auto border-0! bg-muted/40! px-[0.75em]! py-[0.6em]! text-[13px]">
            <code>{code}</code>
          </pre>
          {error && (
            <p className="flex items-start gap-1.5 border-t border-border px-2 py-1 font-sans text-[12px] text-destructive">
              <Icon icon={TriangleAlert} size={13} className="mt-0.5 shrink-0" />
              <span>Couldn&apos;t draw this diagram: {error}</span>
            </p>
          )}
        </>
      )}
    </figure>
  );
}

/** Mermaid sizes its SVG to 100% of the box with a max-width; give it its own width instead, so a wide diagram scrolls */
function naturalWidth(svg: string): string {
  const max = /max-width:\s*([\d.]+)px/.exec(svg)?.[1];
  if (!max) return svg;
  return svg.replace(/width="100%"/, `width="${max}"`).replace(/max-width:\s*[\d.]+px;?/, "max-width: none;");
}
