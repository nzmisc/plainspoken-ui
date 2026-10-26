import type { Metadata } from "next";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { CodeBlock } from "@/components/site/code-block";
import { A, C, DocsPage, H2, P, RefTable } from "@/components/site/docs";
import { Example } from "@/components/site/example";

export const metadata: Metadata = {
  title: "Control sizes",
  description: "The one height scale every plainspoken-ui control shares, and how to set it per control, per area or per screen size.",
};

const USE: Record<string, string> = {
  xs: "Inside running text and dense table rows",
  sm: "Toolbars, panel title bars, row actions",
  md: "The default: forms, dialogs, page headers",
  lg: "Touch screens, and a page's one big call to action",
};

export default function ControlSizes() {
  return (
    <DocsPage
      title="Control sizes"
      lead="Four heights, 20, 24, 28 and 36px. Every control of one size is exactly that tall, border included, whatever is inside it, so a button, an input and a select side by side line up to the pixel."
    >
      <Example name="input-sizes" item="input" heading={false} />
      <RefTable
        head={["Size", "Height", "Text", "Icon", "For"]}
        rows={CONTROL_SIZES.map((s) => [
          <C key={s}>{s}</C>,
          `${CONTROL_HEIGHT[s]}px`,
          { xs: "12px", sm: "13px", md: "14px", lg: "16px" }[s],
          { xs: "12px", sm: "14px", md: "16px", lg: "18px" }[s],
          USE[s],
        ])}
      />

      <H2>Setting the size</H2>
      <P>
        Each control takes a <C>size</C> prop. Leave it out and the control takes the size of the area it is in, which is{" "}
        <C>md</C> unless something says otherwise. To make a whole area smaller, put a size class on it:
      </P>
      <CodeBlock
        code={`<Button size="lg">Sign up</Button>

<div className="ctl-sm flex gap-1">   {/* a toolbar: everything inside is 24px */}
  <IconButton icon={Bold} label="Bold" />
  <Select options={["Paragraph", "Heading"]} aria-label="Style" />
</div>

<form className="ctl-lg md:ctl-md">   {/* big on phones, regular from md up */}
  …
</form>`}
      />
      <P>
        The sizes are CSS variables (<C>--ctl-h</C>, <C>--ctl-px</C>, <C>--ctl-text</C>, <C>--ctl-icon</C> and a few more)
        set by the <C>ctl-xs</C> … <C>ctl-lg</C> utilities, and variables are inherited. That is why a class on a container
        works, why responsive variants work, and why no React context is needed: buttons and chips render fine in server
        components.
      </P>

      <H2>Why fixed heights</H2>
      <P>
        Most libraries size a button from its padding and its text&apos;s line height. Change the font, add an icon, or put an
        input next to it, and the heights drift apart by a pixel or two. Here the height is set and the content is centred in
        it, so rows of mixed controls stay level in every font.
      </P>
      <P>
        For layout maths (a toolbar&apos;s height, rows of a virtual list) the pixel values are exported as{" "}
        <C>CONTROL_HEIGHT</C> from <C>lib/controls.ts</C>, and as Tailwind spacing (<C>h-ctl-md</C>, <C>min-h-ctl-sm</C>).
        See the <A href="/storybook/index.html?path=/docs/foundations-control-sizes--docs">Storybook page</A> for every
        control measured.
      </P>
    </DocsPage>
  );
}
