import type { Metadata } from "next";
import { buildTheme, COLOR_TOKENS } from "@/lib/theme";
import { registryItemUrl } from "@/lib/site";
import { CodeBlock, Command } from "@/components/site/code-block";
import { A, C, DocsPage, H2, P, RefTable } from "@/components/site/docs";
import { buttonVariants } from "@/registry/plainspoken/ui/button";

export const metadata: Metadata = {
  title: "Theming",
  description: "plainspoken-ui uses shadcn/ui's CSS variables, plus link, visited, success and warning colours.",
};

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
        <a href="/customize" className={buttonVariants({ variant: "primary" })}>
          Open the customizer
        </a>
      </p>
      <H2>The default theme</H2>
      <P>
        White and black, plain HTML grays, a black main colour (white in dark mode), the browser&apos;s blue and purple links,
        Geist, and no corner radius. Install it with:
      </P>
      <Command>{`npx shadcn@latest add ${registryItemUrl("theme")}`}</Command>

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
