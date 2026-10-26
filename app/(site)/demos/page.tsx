import type { Metadata } from "next";
import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import { DocsPage } from "@/components/site/docs";

export const metadata: Metadata = {
  title: "Demos",
  description: "Sixteen apps built only from plainspoken-ui components: mail, music, a social feed, a blog, a library catalogue, a Bible reader, a working AI chat, a Kanban board, two rich text editors, a data grid, a budget, an entity-relationship diagram and more.",
};

export default function DemosIndex() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-6">
      <DocsPage title="Demos" lead="Whole apps built from nothing but plainspoken-ui components. Every piece is in the registry, so you can install a demo, or any part of one, into your own project.">
        <ul className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {DEMOS.map((d) => (
            <li key={d.slug} className="bg-background p-4">
              <Link href={`/demos/${d.slug}`} className="text-[16px] font-semibold text-link underline visited:text-link-visited">
                {d.title}
              </Link>
              <p className="mt-1">{d.summary}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Shows: {d.shows}</p>
            </li>
          ))}
        </ul>
      </DocsPage>
    </main>
  );
}
