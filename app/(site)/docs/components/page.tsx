import type { Metadata } from "next";
import Link from "next/link";
import { componentsByCategory } from "@/lib/docs-nav";
import { DocsPage, H2 } from "@/components/site/docs";

export const metadata: Metadata = { title: "Components", description: "Every plainspoken-ui component, by kind." };

export default function ComponentsIndex() {
  const groups = componentsByCategory();
  const count = groups.reduce((n, g) => n + g.entries.length, 0);
  return (
    <DocsPage title="Components" lead={`${count} components, each one file you copy into your project and own from then on.`}>
      {groups.map(({ category, entries }) => (
        <section key={category}>
          <H2>{category}</H2>
          <ul className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {entries.map((e) => (
              <li key={e.name}>
                <Link href={`/docs/components/${e.name}`} className="font-semibold text-link underline visited:text-link-visited">
                  {e.title}
                </Link>
                <p className="text-[13px] text-muted-foreground">{e.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </DocsPage>
  );
}
