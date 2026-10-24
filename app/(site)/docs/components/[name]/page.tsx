import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { registry } from "@/registry/__index__";
import { componentEntries } from "@/lib/docs-nav";
import { ItemDoc } from "@/components/site/item-doc";

export function generateStaticParams() {
  return componentEntries().map((e) => ({ name: e.name }));
}

export async function generateMetadata({ params }: PageProps<"/docs/components/[name]">): Promise<Metadata> {
  const { name } = await params;
  const entry = registry.find((e) => e.name === name);
  if (!entry) return {};
  return { title: entry.title, description: entry.description, alternates: { canonical: `/docs/components/${name}` } };
}

// The page's content depends on the URL, so it sits in Suspense: the layout (header, sidebar) is the
// instant shell a navigation shows first. Every name is prerendered, so this resolves at once.
export default function ComponentPage({ params }: PageProps<"/docs/components/[name]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <ComponentDoc params={params} />
    </Suspense>
  );
}

async function ComponentDoc({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const entry = registry.find((e) => e.name === name && e.type === "registry:ui");
  if (!entry) notFound();
  return <ItemDoc entry={entry} />;
}
