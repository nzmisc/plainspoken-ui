import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { registry } from "@/registry/__index__";
import { blockEntries } from "@/lib/docs-nav";
import { ItemDoc } from "@/components/site/item-doc";

export function generateStaticParams() {
  // Cache Components needs at least one; "none" 404s if there are no blocks yet
  const blocks = blockEntries().map((e) => ({ name: e.name }));
  return blocks.length ? blocks : [{ name: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/docs/blocks/[name]">): Promise<Metadata> {
  const { name } = await params;
  const entry = registry.find((e) => e.name === name);
  if (!entry) return {};
  return { title: entry.title, description: entry.description, alternates: { canonical: `/docs/blocks/${name}` } };
}

// The page's content depends on the URL, so it sits in Suspense: the layout (header, sidebar) is the
// instant shell a navigation shows first. Every name is prerendered, so this resolves at once.
export default function BlockPage({ params }: PageProps<"/docs/blocks/[name]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <BlockDoc params={params} />
    </Suspense>
  );
}

async function BlockDoc({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const entry = registry.find((e) => e.name === name && e.type !== "registry:ui");
  if (!entry) notFound();
  return <ItemDoc entry={entry} />;
}
