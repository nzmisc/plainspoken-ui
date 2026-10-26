import type { Metadata } from "next";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";
import { BibleBookIntro } from "@/registry/plainspoken/blocks/bible/book-intro";
import { BibleChapterGrid } from "@/registry/plainspoken/blocks/bible/chapter-grid";
import { BASE, BOOKS, DESCRIPTIONS, getBook } from "../data";

export function generateStaticParams() {
  return BOOKS.map((b) => ({ book: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/demos/bible/[book]">): Promise<Metadata> {
  const book = getBook((await params).book);
  if (!book) return {};
  return {
    title: `${book.name} (KJV)`,
    description: DESCRIPTIONS[book.slug],
    alternates: { canonical: `${BASE}/${book.slug}` },
  };
}

export default function BookPage({ params }: PageProps<"/demos/bible/[book]">) {
  return (
    <Suspense fallback={<Skeleton lines={8} />}>
      <Book params={params} />
    </Suspense>
  );
}

async function Book({ params }: { params: Promise<{ book: string }> }) {
  const book = getBook((await params).book);
  if (!book) notFound();
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb linkAs={Link} items={[{ label: "Bible", href: BASE }, { label: book.name }]} />
      <BibleBookIntro book={book} description={DESCRIPTIONS[book.slug]} basePath={BASE} linkAs={Link} />
      <section aria-labelledby="chapters" className="flex flex-col gap-2">
        <h2 id="chapters" className="text-[16px] font-bold">
          {book.slug === "psalms" ? "Psalms" : "Chapters"}
        </h2>
        <BibleChapterGrid book={book} basePath={BASE} linkAs={Link} />
      </section>
    </div>
  );
}
