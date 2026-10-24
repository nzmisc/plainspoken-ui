import type { Metadata } from "next";
import { REGISTRY_NAMESPACE, registryItemUrl, siteUrl } from "@/lib/site";
import { CodeBlock, Command } from "@/components/site/code-block";
import { A, C, DocsPage, H2, OL, P, RefTable } from "@/components/site/docs";

export const metadata: Metadata = {
  title: "Installation",
  description: "Add plainspoken-ui components to a React project with Tailwind CSS v4 and the shadcn CLI.",
};

export default function Installation() {
  const base = siteUrl();
  return (
    <DocsPage title="Installation" lead="Any React project with Tailwind CSS v4 works: Next.js, Vite, React Router, Astro. The shadcn CLI does the copying.">
      <H2>1. Set up shadcn</H2>
      <P>
        If the project doesn&apos;t have a <C>components.json</C> yet, let the CLI create one. It adds the <C>cn()</C> helper
        in <C>lib/utils.ts</C> and the colour variables to your CSS file.
      </P>
      <Command>npx shadcn@latest init</Command>

      <H2>2. Add the theme</H2>
      <P>
        Optional, but it is what makes things look like this site: plain grays, black buttons, blue links, no radius. It only
        sets CSS variables, so you can take it out again. To pick your own gray, main colour and fonts, use the{" "}
        <A href="/customize">customizer</A>, which gives you a command like this one.
      </P>
      <Command>{`npx shadcn@latest add ${registryItemUrl("theme")}`}</Command>

      <H2>3. Add components</H2>
      <P>One URL per component. What each one uses comes along with it.</P>
      <Command>{`npx shadcn@latest add ${registryItemUrl("button")} ${registryItemUrl("input")}`}</Command>

      <H2>Or: add the registry by name</H2>
      <P>
        Tell the CLI where <C>{REGISTRY_NAMESPACE}</C> lives, in <C>components.json</C>, and then use short names:
      </P>
      <CodeBlock
        lang="json"
        title="components.json"
        code={`{
  "registries": {
    "${REGISTRY_NAMESPACE}": "${base}/r/{name}.json"
  }
}`}
      />
      <Command>{`npx shadcn@latest add ${REGISTRY_NAMESPACE}/button ${REGISTRY_NAMESPACE}/data-table`}</Command>

      <H2>What you get</H2>
      <RefTable
        head={["Where", "What"]}
        rows={[
          [<C key="a">components/ui/*.tsx</C>, "The components you asked for, one file each."],
          [<C key="b">lib/controls.ts</C>, "The control height scale (sizes, focus ring classes)."],
          [<C key="c">lib/icons.ts</C>, "The icons as data, with Lucide's license next to it."],
          [<C key="d">your CSS file</C>, <>The <C>ctl-xs</C> … <C>ctl-lg</C> utilities and the link, visited, success and warning colours, merged in by the CLI.</>],
        ]}
      />

      <H2>Dark mode</H2>
      <P>
        Like shadcn/ui: put the <C>dark</C> class on <C>&lt;html&gt;</C> (next-themes does this, or a few lines of script).
        Every colour has a dark value.
      </P>

      <H2>Fonts</H2>
      <P>
        The default theme asks for Geist and Geist Mono and falls back to the system fonts. Load Geist however your framework
        loads fonts, for example with <C>next/font/google</C>:
      </P>
      <CodeBlock
        title="app/layout.tsx"
        code={`import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// <html className={\`\${geist.variable} \${geistMono.variable}\`}>, then in your CSS:
// @theme inline { --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif; }`}
      />

      <H2>Next steps</H2>
      <OL>
        <li>
          Put a button in a page: <C>{`import { Button } from "@/components/ui/button"`}</C>.
        </li>
        <li>
          Read about <A href="/docs/control-sizes">control sizes</A>, the one idea everything else builds on.
        </li>
      </OL>
    </DocsPage>
  );
}
