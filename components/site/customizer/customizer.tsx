"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Moon, RotateCcw, Sun } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { A, C, H2, P } from "@/components/site/docs";
import {
  BASE_GRAYS,
  buildTheme,
  css,
  customLinkColours,
  customMainColour,
  FONTS,
  fontStack,
  fontVar,
  gray,
  isDefaultTheme,
  LINK_COLOURS,
  MAIN_COLOURS,
  oklchToHex,
  parseOklch,
  themeCss,
  themeFromParams,
  themeSlug,
  themeToParams,
  type Mode,
  type ThemeOptions,
} from "@/lib/theme";
import { cn } from "@/lib/utils";
import { ColourField } from "./colour-field";
import { ChoiceWarning, ContrastReport, contrastResults } from "./contrast";
import { CodeOut, CommandOut, fontCss, fontSnippet, ShareLink } from "./output";
import { SwatchPicker } from "./swatch-picker";
import { ThemePreview } from "./preview";

// ---------------------------------------------------------------------------------------------
// The state is the address: ?base=stone&main=blue&links=classic&sans=inter&mono=geist-mono
// (themeToParams; defaults left out) plus preview=dark|light. So a theme is a link, and Back
// undoes a reset.

type Key = "base" | "main" | "links" | "sans" | "mono" | "preview";

/** Commas are fine in a query and easier to read than %2C (custom links are "0000ee,551a8b") */
const toQuery = (p: URLSearchParams) => p.toString().replace(/%2C/gi, ",");

function createAddressStore(sync: boolean) {
  let current: string | null = sync ? null : "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const read = () => location.search.replace(/^\?/, "");
  const href = (q: string) => (q ? `?${q}` : location.pathname);
  return {
    get: () => (current ??= read()),
    subscribe(onChange: () => void) {
      listeners.add(onChange);
      const onPop = () => {
        current = read();
        onChange();
      };
      if (sync) addEventListener("popstate", onPop);
      return () => {
        listeners.delete(onChange);
        if (sync) removeEventListener("popstate", onPop);
      };
    },
    /** Replace the address (debounced: a colour picker fires on every move, and Safari limits replaceState) or push it */
    set(q: string, push = false) {
      current = q;
      listeners.forEach((l) => l());
      if (!sync) return;
      clearTimeout(timer);
      if (push) history.pushState(null, "", href(q));
      else timer = setTimeout(() => history.replaceState(null, "", href(q)), 250);
    },
  };
}

const noSubscribe = () => () => {};

/** The site's own light/dark (the .dark class on <html>), which the preview follows until told otherwise */
function subscribeSiteMode(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

// ---------------------------------------------------------------------------------------------

const hex = (cssColour: string) => oklchToHex(parseOklch(cssColour)!);

const baseOptions = BASE_GRAYS.map((b) => ({
  value: b.id,
  label: b.label,
  // Mid grays show the tint best; the lightest and darkest have almost none
  colours: [0.92, 0.7, 0.45].map((l) => css(gray(b, l))),
  title: `${b.label}: three of its grays`,
}));

const fontOptions = (kinds: string[]) =>
  [
    { group: "Sans serif", kind: "sans" },
    { group: "Serif", kind: "serif" },
    { group: "Monospace", kind: "mono" },
  ]
    .filter((g) => kinds.includes(g.kind))
    .map((g) => ({ group: g.group, options: FONTS.filter((f) => f.kind === g.kind).map((f) => ({ value: f.id, label: f.label })) }));

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <H2 id={id}>{title}</H2>
      {children}
    </section>
  );
}

export interface CustomizerProps {
  /** Keep the choices in the page's address (off in Storybook, whose iframe address isn't ours) */
  syncUrl?: boolean;
  /** This site's origin as the server knows it, for the URLs in the first render; the browser's own replaces it */
  siteOrigin?: string;
  className?: string;
}

/**
 * The theme customizer: base gray, main colour, link colours and fonts on the left, a live preview
 * built from the real components on the right, then the contrast report and the CSS, shadcn
 * command, font lines and share link that make it yours. The theme is applied only inside the
 * preview, as CSS variables on its container.
 */
export function Customizer({ syncUrl = true, siteOrigin = "", className }: CustomizerProps) {
  const [store] = useState(() => createAddressStore(syncUrl));
  const query = useSyncExternalStore(store.subscribe, store.get, () => "");
  const origin = useSyncExternalStore(noSubscribe, () => location.origin, () => siteOrigin);
  const siteDark = useSyncExternalStore(subscribeSiteMode, () => document.documentElement.classList.contains("dark"), () => false);

  const params = useMemo(() => new URLSearchParams(query), [query]);
  const options = useMemo(() => themeFromParams(params), [params]);
  const theme = useMemo(() => buildTheme(options), [options]);
  const results = useMemo(() => contrastResults(theme), [theme]);
  const previewParam = params.get("preview");
  const mode: Mode = previewParam === "dark" || previewParam === "light" ? previewParam : siteDark ? "dark" : "light";

  // The last custom colours, so trying a preset and coming back doesn't lose them
  const [savedMain, setSavedMain] = useState<string | null>(null);
  const [savedLinks, setSavedLinks] = useState<[string, string] | null>(null);
  // Hex from the options themselves, not the rounded CSS, so #0000ee stays #0000ee
  const mainHex = oklchToHex(options.main.light ?? gray(options.base, 0.2));
  const linkHexes: [string, string] = options.links.light
    ? [oklchToHex(options.links.light.link), oklchToHex(options.links.light.visited)]
    : [hex(theme.light.link), hex(theme.light["link-visited"])];
  const customMain = options.main.id === "custom" ? mainHex : (savedMain ?? mainHex);
  const customLinks = options.links.id === "custom" ? linkHexes : (savedLinks ?? linkHexes);

  /** Change one choice; the address is rewritten from the result, so defaults drop out of it */
  function update(changes: Partial<Record<Key, string | null>>, push = false) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) p.delete(k);
      else p.set(k, v);
    }
    const next = themeToParams(themeFromParams(p));
    const preview = p.get("preview");
    if (preview) next.set("preview", preview);
    store.set(toQuery(next), push);
  }
  const setMain = (v: string) => {
    if (options.main.id === "custom") setSavedMain(customMain);
    update({ main: v === "custom" ? customMain.slice(1) : v });
  };
  const setLinks = (v: string) => {
    if (options.links.id === "custom") setSavedLinks(customLinks);
    update({ links: v === "custom" ? customLinks.map((h) => h.slice(1)).join(",") : v });
  };

  const mainOptions = [
    ...MAIN_COLOURS.map((m) => {
      const light = m.light ?? gray(options.base, 0.2);
      const dark = m.dark ?? gray(options.base, 0.93);
      return { value: m.id, label: m.label, colours: [css(light), css(dark)], title: `${m.label}: the light and dark mode shades` };
    }),
    { value: "custom", label: "Custom", colours: [customMain, css(customMainColour(customMain).dark!)], title: "Your own colour: the light and dark mode shades" },
  ];

  const linkSwatches = (links: ThemeOptions["links"]) => {
    const t = buildTheme({ ...options, links });
    return (
      <span aria-hidden className="mr-1.5 inline-flex h-3.5 border border-border align-[-0.15em]">
        <span className="block h-full w-2" style={{ background: t.light.link }} />
        <span className="block h-full w-2" style={{ background: t.light["link-visited"] }} />
      </span>
    );
  };

  // The theme, applied to the preview only: every token as a variable on its container
  const sansVar = fontVar(options.sans);
  const monoVar = fontVar(options.mono);
  const previewStyle = {
    ...Object.fromEntries(Object.entries(theme[mode]).map(([k, v]) => [`--${k}`, v])),
    "--font-sans": fontStack(options.sans.stack, sansVar),
    "--font-mono": fontStack(options.mono.stack, monoVar),
    // The site's compiled font-sans and font-mono utilities read --font-geist(-mono) directly
    ...(options.sans.id !== "geist" && { "--font-geist": sansVar ? `var(${sansVar})` : options.sans.stack }),
    ...(options.mono.id !== "geist-mono" && { "--font-geist-mono": monoVar ? `var(${monoVar})` : options.mono.stack }),
    fontFamily: "var(--font-sans)",
    colorScheme: mode,
  } as CSSProperties;

  const isDefault = isDefaultTheme(options);
  const slug = themeSlug(options);
  const registryUrl = `${origin}${isDefault ? "/r/theme.json" : `/r/themes/${slug}.json`}`;
  const shareQuery = toQuery(themeToParams(options));
  const shareUrl = `${origin}/customize${shareQuery ? `?${shareQuery}` : ""}`;
  const cssOut = themeCss(theme, { fontVars: { sans: sansVar, mono: monoVar } });
  const fontsOut = fontSnippet(options);
  const summary = [options.base.label, options.main.id === "custom" ? customMain : options.main.label, `${options.sans.label} / ${options.mono.label}`].join(" · ");

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]", className)}>
      <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-0 lg:-mx-1 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:px-1 lg:py-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-bold">Theme</h2>
          <Button size="sm" icon={RotateCcw} disabled={isDefault} onClick={() => update({ base: null, main: null, links: null, sans: null, mono: null }, true)}>
            Reset
          </Button>
        </div>

        <SwatchPicker legend="Base gray" value={options.base.id} onChange={(v) => update({ base: v })} options={baseOptions} />

        <SwatchPicker
          legend="Main colour"
          value={options.main.id}
          onChange={setMain}
          options={mainOptions}
          extra={
            <>
              <ColourField
                className="mt-2"
                label="Custom colour"
                hint="Used as it is in light mode, a lighter shade of it in dark mode."
                value={customMain}
                onChange={(h) => {
                  setSavedMain(h);
                  update({ main: h.slice(1) });
                }}
              />
              <ChoiceWarning results={results} source="main" />
            </>
          }
        />

        <div className="flex flex-col gap-2">
          <RadioGroup
            legend="Link colours"
            value={options.links.id}
            onChange={setLinks}
            options={[
              { value: "classic", label: <>{linkSwatches(LINK_COLOURS[0])}Classic</>, description: "Blue, and purple once visited" },
              {
                value: "main",
                label: <>{linkSwatches(LINK_COLOURS[1])}Main colour</>,
                description: options.main.id === "black" ? "With black: the text colour, gray once visited" : "Visited ones a darker, duller shade",
              },
              { value: "custom", label: <>{linkSwatches(customLinkColours(...customLinks))}Custom</>, description: "Your own pair" },
            ]}
          />
          {options.links.id === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <ColourField
                label="Link"
                value={customLinks[0]}
                onChange={(h) => {
                  setSavedLinks([h, customLinks[1]]);
                  update({ links: `${h.slice(1)},${customLinks[1].slice(1)}` });
                }}
              />
              <ColourField
                label="Visited"
                value={customLinks[1]}
                onChange={(h) => {
                  setSavedLinks([customLinks[0], h]);
                  update({ links: `${customLinks[0].slice(1)},${h.slice(1)}` });
                }}
              />
            </div>
          )}
          <ChoiceWarning results={results} source="links" />
        </div>

        <Field label="Text font">
          <Select value={options.sans.id} onChange={(e) => update({ sans: e.target.value })} options={fontOptions(["sans", "serif"])} className="w-full" />
        </Field>
        <Field label="Code font">
          <Select value={options.mono.id} onChange={(e) => update({ mono: e.target.value })} options={fontOptions(["mono"])} className="w-full" />
        </Field>
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="preview" className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-b-0 border-border bg-muted px-2 py-1">
            <h2 id="preview" className="text-[14px] font-bold">
              Preview
            </h2>
            <span className="min-w-0 truncate text-[13px] text-muted-foreground">{summary}</span>
            <SegmentedControl
              className="ml-auto"
              size="sm"
              label="Preview in"
              value={mode}
              onChange={(m) => update({ preview: m })}
              options={[
                { value: "light", label: <span className="inline-flex items-center gap-1"><Icon icon={Sun} />Light</span> },
                { value: "dark", label: <span className="inline-flex items-center gap-1"><Icon icon={Moon} />Dark</span> },
              ]}
            />
          </div>
          <div
            data-theme-preview
            className={cn("border border-border bg-background text-foreground", mode === "dark" && "dark")}
            style={previewStyle}
          >
            <ThemePreview />
          </div>
        </section>

        <Section id="contrast" title="Contrast">
          <P>
            WCAG 2 contrast for the pairs that matter, in both modes, against level AA: 4.5:1 for text, 3:1 for the edges of
            controls and the focus ring. The grays are fixed and always pass; the main and link colours are yours to get right.
          </P>
          <ContrastReport results={results} options={options} />
        </Section>

        <Section id="use-it" title="Use it">
          <P>
            In your global CSS file (<C>app/globals.css</C> in Next.js), replace the <C>:root</C>, <C>.dark</C> and{" "}
            <C>@theme inline</C> blocks that <C>shadcn init</C> wrote with this. Keep the <C>@import</C> and{" "}
            <C>@custom-variant dark</C> lines above them. Components you have already installed change with it: they only use
            these variables.
          </P>
          <CodeOut title="app/globals.css" code={cssOut} copyLabel="Copy CSS" maxHeight />

          <P>Or let the shadcn CLI merge the same variables into your CSS file:</P>
          <CommandOut command={`npx shadcn@latest add ${registryUrl}`} />

          <h3 className="mt-2 text-[16px] font-bold">Fonts</h3>
          {fontsOut ? (
            <>
              <P>
                The theme asks for {[options.sans, options.mono].filter((f) => f.google).map((f) => f.label).join(" and ")} and
                falls back to the system fonts until they load. In Next.js, load them with <C>next/font/google</C> under the
                variable names the CSS looks for:
              </P>
              <CodeOut title="app/layout.tsx" code={fontsOut} copyLabel="Copy" />
              <P>
                The CSS above already points Tailwind&apos;s <C>font-sans</C> and <C>font-mono</C> at them. If you kept your own
                CSS, these are the lines:
              </P>
              <CodeOut title="app/globals.css" code={fontCss(options)} copyLabel="Copy" />
              <P className="text-[13px] text-muted-foreground">
                Not on Next.js? Load them from Google Fonts or{" "}
                {[options.sans, options.mono]
                  .filter((f) => f.source)
                  .map((f, i, all) => (
                    <span key={f.id}>
                      {i > 0 && (i === all.length - 1 ? " and " : ", ")}
                      <A href={f.source!}>{f.label}&apos;s own site</A>
                    </span>
                  ))}
                ; the font stacks find them by name.
              </P>
            </>
          ) : (
            <P>System fonts: nothing to load.</P>
          )}

          <h3 className="mt-2 text-[16px] font-bold">Share</h3>
          <ShareLink url={shareUrl} label="This theme in the customizer" />
        </Section>
      </div>
    </div>
  );
}
