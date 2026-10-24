import type { Metadata } from "next";
import Link from "next/link";
import { blockEntries } from "@/lib/docs-nav";
import { DEMOS } from "@/lib/demos";
import { A, DocsPage, H2, P } from "@/components/site/docs";

export const metadata: Metadata = {
  title: "Blocks",
  description: "Bigger pieces built from plainspoken-ui components, taken from the demo apps: install any of them on its own.",
};

export default function BlocksIndex() {
  const blocks = blockEntries();
  const groups = new Map<string, typeof blocks>();
  for (const b of blocks) groups.set(b.category, [...(groups.get(b.category) ?? []), b]);
  return (
    <DocsPage title="Blocks" lead="Bigger pieces built from the components: a message list, a player bar, a pricing table. Each comes from one of the demos, and each installs on its own.">
      {blocks.length === 0 && <P>None yet.</P>}
      {[...groups.entries()].map(([demo, entries]) => {
        const d = DEMOS.find((x) => x.title === demo);
        return (
          <section key={demo}>
            <H2>{demo}</H2>
            {d && (
              <P className="text-muted-foreground">
                From the <A href={`/demos/${d.slug}`}>{d.title} demo</A>.
              </P>
            )}
            <ul className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {entries.map((e) => (
                <li key={e.name}>
                  <Link href={`/docs/blocks/${e.name}`} className="font-semibold text-link underline visited:text-link-visited">
                    {e.title}
                  </Link>
                  <p className="text-[13px] text-muted-foreground">{e.description}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </DocsPage>
  );
}
