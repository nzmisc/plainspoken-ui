import type { Metadata } from "next";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";
import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";
import { BibleChapterPager } from "@/registry/plainspoken/blocks/bible/chapter-pager";
import { BibleJump } from "@/registry/plainspoken/blocks/bible/jump";
import { BibleReaderSettings } from "@/registry/plainspoken/blocks/bible/reader-settings";
import { chapterName, neighbours } from "@/registry/plainspoken/blocks/bible/lib";
import { BASE, BOOKS, chaptersOf, getBook, summary } from "../../data";

export function generateStaticParams() {
  return BOOKS.flatMap((b) => Array.from({ length: b.chapters }, (_, i) => ({ book: b.slug, chapter: String(i + 1) })));
}

/** The book and chapter from the URL, or null for a chapter that doesn't exist */
function find(slug: string, chapter: string) {
  const book = getBook(slug);
  const n = Number(chapter);
  if (!book || !/^\d+$/.test(chapter) || n < 1 || n > book.chapters) return null;
  return { book, n };
}

export async function generateMetadata({ params }: PageProps<"/demos/bible/[book]/[chapter]">): Promise<Metadata> {
  const { book: slug, chapter } = await params;
  const found = find(slug, chapter);
  if (!found) return {};
  return {
    title: `${chapterName(found.book, found.n)} (KJV)`,
    description: summary(found.book.slug, found.n),
    alternates: { canonical: `${BASE}/${found.book.slug}/${found.n}` },
  };
}

export default function ChapterPage({ params }: PageProps<"/demos/bible/[book]/[chapter]">) {
  return (
    <Suspense fallback={<Skeleton lines={14} />}>
      <Chapter params={params} />
    </Suspense>
  );
}

async function Chapter({ params }: { params: Promise<{ book: string; chapter: string }> }) {
  const { book: slug, chapter } = await params;
  const found = find(slug, chapter);
  if (!found) notFound();
  const { book, n } = found;
  const { prev, next } = neighbours(BOOKS, book.slug, n);
  const target = (t: typeof prev) => t && { slug: t.book.slug, name: t.book.name, chapter: t.chapter };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Breadcrumb linkAs={Link} items={[{ label: "Bible", href: BASE }, { label: book.name, href: `${BASE}/${book.slug}` }, { label: `Chapter ${n}` }]} />
        <div className="ctl-sm flex flex-wrap items-center gap-1.5">
          <BibleJump key={`${book.slug}/${n}`} books={BOOKS} book={book.slug} chapter={n} basePath={BASE} />
          <BibleReaderSettings />
        </div>
      </div>
      <BibleChapter book={book} chapter={n} text={chaptersOf(book.slug)[n - 1]} />
      <BibleChapterPager prev={target(prev)} next={target(next)} basePath={BASE} linkAs={Link} className="max-w-[68ch] border-t border-border pt-4" />
    </div>
  );
}
