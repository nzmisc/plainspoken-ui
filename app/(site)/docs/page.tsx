import type { Metadata } from "next";
import { A, C, DocsPage, H2, P, UL } from "@/components/site/docs";
import { Example } from "@/components/site/example";

export const metadata: Metadata = {
  title: "Introduction",
  description: "What plainspoken-ui is, how it differs from other component libraries, and how to use it.",
};

export default function Introduction() {
  return (
    <DocsPage
      title="Introduction"
      lead="React components that look like the web did before every button became a pill: square corners, gray buttons with borders, tables with lines, and links that are blue until you've visited them."
    >
      <P>
        plainspoken-ui is for tools people use all day (admin pages, dashboards, inboxes, editors) and works just as well for a
        landing page or a blog. It is dense without being cramped, and it says what things are instead of decorating them.
      </P>
      <P>
        It is not a package you install. Like <A href="https://ui.shadcn.com">shadcn/ui</A>, it is a registry: you copy the
        components you want into your project with the shadcn CLI, and from then on they are your code. There is no npm
        package and no version to keep up with.
      </P>
      <Example name="button-sizes" item="button" heading={false} />

      <H2>What is different about it</H2>
      <UL>
        <li>
          <strong>Controls share one height scale.</strong> Every button, input, select, segmented control and checkbox row
          of one size is exactly 20, 24, 28 or 36px tall, so anything you put side by side lines up.{" "}
          <A href="/docs/control-sizes">Control sizes</A>
        </li>
        <li>
          <strong>Real links.</strong> Links in text are underlined, in the link colour, and change colour once visited, the
          way browsers have always shown them.
        </li>
        <li>
          <strong>Native elements first.</strong> Dialogs are <C>&lt;dialog&gt;</C>, selects are <C>&lt;select&gt;</C>,
          accordions are <C>&lt;details&gt;</C>, checkboxes are checkboxes. The browser does focus trapping, keyboard
          handling and the phone pickers. No Radix, no Base UI, no React Aria: the only packages are{" "}
          <C>clsx</C> and <C>tailwind-merge</C>, which shadcn&apos;s <C>cn()</C> already needs.
        </li>
        <li>
          <strong>shadcn/ui&apos;s token names.</strong> <C>background</C>, <C>primary</C>, <C>muted-foreground</C>,{" "}
          <C>border</C>, <C>ring</C> and the rest, in oklch, with a <C>.dark</C> class. Themes made for shadcn/ui work here,
          and shadcn/ui components can live in the same app. <A href="/docs/theming">Theming</A>
        </li>
        <li>
          <strong>Square.</strong> No corner radius anywhere, and the theme sets <C>--radius</C> to 0 so shadcn/ui
          components next to these match.
        </li>
        <li>
          <strong>Icons as data.</strong> About 300 Lucide icons are copied in as plain data and drawn by one{" "}
          <C>&lt;Icon&gt;</C> component. No icon package. <A href="/docs/icons">Icons</A>
        </li>
        <li>
          <strong>Server components welcome.</strong> Sizes are CSS variables rather than React context, so buttons, chips
          and badges render on the server; only the parts that need state are client components.
        </li>
        <li>
          <strong>Accessible by default.</strong> Keyboard support follows the ARIA patterns, every icon-only button needs a
          label, text meets WCAG AA contrast and control edges meet 3:1.
        </li>
      </UL>

      <H2>Where to go next</H2>
      <UL>
        <li>
          <A href="/docs/installation">Install it</A> into a project that has Tailwind CSS v4.
        </li>
        <li>
          Browse the <A href="/docs/components">components</A>, or the same in <A href="/storybook/index.html">Storybook</A>.
        </li>
        <li>
          See them used in <A href="/demos">sixteen demo apps</A>: an email client, a music player, a working AI chat, a
          Kanban board, a data grid, two rich text editors, an entity-relationship diagram and more.
        </li>
        <li>
          Make it yours in the <A href="/customize">customizer</A>: base gray, main colour, link colours and fonts.
        </li>
      </UL>

      <H2>Status</H2>
      <P>
        Version 0, built in the open at <A href="https://github.com/nzmisc/plainspoken-ui">nzmisc/plainspoken-ui</A> under
        the MIT license. Names and props may still change.
      </P>
    </DocsPage>
  );
}
