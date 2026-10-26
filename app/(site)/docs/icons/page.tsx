import type { Metadata } from "next";
import { CodeBlock } from "@/components/site/code-block";
import { A, C, DocsPage, H2, P } from "@/components/site/docs";
import { IconGallery } from "@/components/site/icon-gallery";

export const metadata: Metadata = {
  title: "Icons",
  description: "About 300 Lucide icons, copied in as plain data and drawn by one Icon component. No icon package.",
};

export default function IconsPage() {
  return (
    <DocsPage
      title="Icons"
      lead="About 300 icons from Lucide, copied in as plain data: each one is a list of SVG shapes. One <Icon> component draws them all the same way, so there is no icon package to install."
    >
      <CodeBlock
        code={`import { Inbox } from "@/lib/icons";
import { Icon } from "@/components/ui/icon";

<Icon icon={Inbox} />                 // decorative: hidden from screen readers
<Icon icon={Inbox} label="Inbox" />   // meaningful on its own: announced
<Button icon={Inbox}>Inbox</Button>   // components take the icon itself`}
      />
      <H2>All icons</H2>
      <IconGallery />
      <H2>Adding icons</H2>
      <P>
        Lucide has about 1,900. To copy more in, run the script from this repo with their Lucide names; it fetches the SVG
        once and writes one line per icon into <C>lib/icons.ts</C>:
      </P>
      <CodeBlock lang="sh" code={`node scripts/copy-lucide.mjs bell-ring folder-git-2`} />
      <P>
        Or write one by hand: an icon is <C>{`{ name, nodes }`}</C>, the shapes on a 24px grid, drawn with a 2px round
        stroke. Lucide&apos;s <A href="https://lucide.dev/guide/design/icon-design-guide">design guide</A> has the rules
        that keep a new one looking like the rest. Lucide is ISC licensed; the license travels with the icons.
      </P>
    </DocsPage>
  );
}
