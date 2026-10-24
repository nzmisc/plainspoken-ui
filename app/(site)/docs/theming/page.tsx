import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BASE_GRAYS, buildTheme, COLOR_TOKENS, FONTS, MAIN_COLOURS } from "@/lib/theme";
import { registryItemUrl, siteUrl } from "@/lib/site";
import { CodeBlock, Command } from "@/components/site/code-block";
import { A, C, DocsPage, H2, P, RefTable, UL } from "@/components/site/docs";
import { buttonVariants } from "@/registry/plainspoken/ui/button";

export const metadata: Metadata = {
  title: "Theming",
  description:
    "plainspoken-ui uses shadcn/ui's CSS variables, plus link, visited, success and warning colours. Make your own theme with the customizer and install it with the shadcn CLI.",
};

const ids = (list: { id: string }[]) => list.map((x, i) => <C key={i}>{x.id}</C>).reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), []);

const PURPOSE: Record<string, string> = {
  background: "Page background",
  foreground: "Text",
  card: "Raised surfaces (cards, panels)",
  popover: "Menus, popovers, tooltips",
  primary: "The main colour: primary buttons, the chosen segment, focus rings",
  secondary: "Gray fill of default and secondary buttons",
  muted: "Header rows, input affixes, quiet fills (a background)",
  "muted-foreground": "Secondary text: hints, captions, meta",
  accent: "Hover and pressed fills",
  destructive: "Errors and destructive actions",
  success: "Done, healthy, passed",
  warning: "Needs attention",
  border: "Rules: table lines, panel edges",
  input: "Edges of controls (3:1 against the background)",
  ring: "Focus outline",
  link: "Links",
  "link-visited": "Visited links",
};

function Swatch({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[12px]">
      <span aria-hidden className="inline-block size-4 border border-border" style={{ background: value }} />
      {value}
    </span>
  );
}

export default function Theming() {
  const t = buildTheme();
  const tokens = COLOR_TOKENS.filter((tok) => PURPOSE[tok]);
  return (
    <DocsPage
      title="Theming"
      lead="The colours are shadcn/ui's CSS variables, so a theme made for shadcn/ui works here, and these components and shadcn/ui's can share one app."
    >
      <p>
        <Link href="/customize" className={buttonVariants({ variant: "primary" })}>
          Open the customizer
        </Link>
      </p>
      <H2>The default theme</H2>
      <P>
        White and black, plain HTML grays, a black main colour (white in dark mode), the browser&apos;s blue and purple links,
        Geist, and no corner radius. Install it with:
      </P>
      <Command>{`npx shadcn@latest add ${registryItemUrl("theme")}`}</Command>

      <H2>Your own theme</H2>
      <P>
        The <A href="/customize">customizer</A> has four choices: a base gray (shadcn/ui&apos;s seven), a main colour (black,
        ten colours or any hex), link colours (classic blue and purple, the main colour, or your own pair) and the text and code
        fonts. It shows them on the real components in light and dark, checks the contrast, and gives you three ways to use the
        result:
      </P>
      <UL>
        <li>
          a CSS block to paste over the <C>:root</C>, <C>.dark</C> and <C>@theme inline</C> blocks that <C>shadcn init</C>{" "}
          wrote;
        </li>
        <li>a shadcn command that merges the same variables into your CSS file;</li>
        <li>the <C>next/font/google</C> lines for the fonts, if they need loading.</li>
      </UL>
      <P>The command points at a URL that spells out the theme, so it needs no account and nothing is stored:</P>
      <Command>{`npx shadcn@latest add ${siteUrl()}/r/themes/base-stone.main-blue.links-classic.sans-inter.mono-geist-mono.json`}</Command>
      <RefTable
        head={["Part", "Values"]}
        rows={[
          [<C key="p">base-…</C>, <span key="v">{ids(BASE_GRAYS)}</span>],
          [<C key="p">main-…</C>, <span key="v">{ids(MAIN_COLOURS)}, or six hex digits without the #: <C>main-2a78d6</C></span>],
          [<C key="p">links-…</C>, <span key="v"><C>classic</C>, <C>main</C>, or two hex colours, link then visited: <C>links-0000ee-551a8b</C></span>],
          [<C key="p">sans-…</C>, <span key="v">{ids(FONTS.filter((f) => f.kind !== "mono"))}</span>],
          [<C key="p">mono-…</C>, <span key="v">{ids(FONTS.filter((f) => f.kind === "mono"))}</span>],
        ]}
      />
      <P>
        Parts can come in any order, and a part left out is the default. An unknown value gets a 404 rather than a quietly
        different theme. The customizer&apos;s own address works the same way (<C>/customize?base=stone&amp;main=blue</C>), so a
        theme is also a link you can share.
      </P>
      <P>
        Custom colours are used as they are in light mode; dark mode gets a lighter, softer shade of them so they stay readable
        on the dark background. The grays always pass WCAG AA; a custom main or link colour may not, and the customizer says so.
      </P>

      <H2>Fonts</H2>
      <P>
        A theme sets <C>--font-sans</C> and <C>--font-mono</C> to a stack that tries a font loader&apos;s variable first, then the
        font by name, then the system fonts: <C>var(--font-inter, &quot;Inter&quot;), &quot;Inter&quot;, ui-sans-serif, …</C>. With{" "}
        <C>next/font</C>, give the font that variable name (the customizer writes the lines); anywhere else, load the font by
        name and the stack finds it. The system stacks need nothing loaded.
      </P>

      <H2>Tokens</H2>
      <P>
        Each has a <C>-foreground</C> partner where text sits on it (<C>primary-foreground</C> on <C>primary</C>). Watch out:
        shadcn&apos;s <C>muted</C> is a background; muted <em>text</em> is <C>text-muted-foreground</C>.
      </P>
      <RefTable
        head={["Token", "For", "Light", "Dark"]}
        rows={tokens.map((tok) => [<C key={tok}>{tok}</C>, PURPOSE[tok], <Swatch key="l" value={t.light[tok]} />, <Swatch key="d" value={t.dark[tok]} />])}
      />

      <H2>Added to shadcn&apos;s set</H2>
      <P>
        shadcn/ui has no link colours, so plainspoken-ui adds <C>--link</C> and <C>--link-visited</C>, plus{" "}
        <C>--success</C> and <C>--warning</C> for status. They come with the first component you install (the{" "}
        <C>foundation</C> item), with defaults, so an existing shadcn theme keeps working.
      </P>
      <CodeBlock
        lang="css"
        code={`:root {
  --link: ${t.light.link};
  --link-visited: ${t.light["link-visited"]};
  --success: ${t.light.success};
  --warning: ${t.light.warning};
}
.dark {
  --link: ${t.dark.link};
  --link-visited: ${t.dark["link-visited"]};
  --success: ${t.dark.success};
  --warning: ${t.dark.warning};
}`}
      />

      <H2>Radius</H2>
      <P>
        None. The theme sets <C>--radius: 0rem</C> and no component rounds a corner. A radius setting may come later; the
        reasoning is in the <A href="https://github.com/nzmisc/plainspoken-ui/blob/main/docs/concepts/theming.md">theming concepts</A>.
      </P>
    </DocsPage>
  );
}
