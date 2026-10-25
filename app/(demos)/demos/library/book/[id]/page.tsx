import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heart, ListPlus, Star } from "@/registry/plainspoken/lib/icons";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";
import { LibraryBookDetails } from "@/registry/plainspoken/blocks/library/book-details";
import { LibraryCopiesTable } from "@/registry/plainspoken/blocks/library/copies-table";
import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";
import { LibraryShelf } from "@/registry/plainspoken/blocks/library/shelf";
import { BASE, BOOKS, BRANCHES, PATRON, TODAY, availabilityOf, callNumber, copiesOf, getBook, similarTo } from "../../data";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";

export function generateStaticParams() {
  return BOOKS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: PageProps<"/demos/library/book/[id]">): Promise<Metadata> {
  const b = getBook((await params).id);
  if (!b) return {};
  return {
    title: `${b.title}${b.subtitle ? `: ${b.subtitle}` : ""} by ${b.author}`,
    description: b.description,
    alternates: { canonical: `${BASE}/book/${b.id}` },
  };
}

export default function BookPage({ params }: PageProps<"/demos/library/book/[id]">) {
  return (
    <Suspense fallback={<Skeleton lines={12} />}>
      <Book params={params} />
    </Suspense>
  );
}

async function Book({ params }: { params: Promise<{ id: string }> }) {
  const b = getBook((await params).id);
  if (!b) notFound();
  const availability = availabilityOf(b);
  const copies = copiesOf(b);
  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        linkAs={Link}
        items={[
          { label: "Catalogue", href: BASE },
          { label: b.audience === "Adult" ? b.subjects[0] : b.audience, href: `${BASE}/search?in=subject&q=${encodeURIComponent(b.subjects[0])}` },
          { label: b.title },
        ]}
      />
      <LibraryBookDetails
        book={b}
        availability={availability}
        callNumber={callNumber(b, b.formats.includes("book") ? "book" : b.formats[0])}
        searchPath={`${BASE}/search`}
        linkAs={Link}
        actions={
          <>
            <LibraryHoldDialog book={b} availability={availability} branches={BRANCHES} defaultBranch={PATRON.homeBranch} today={TODAY} variant="primary" />
            <DropdownMenu
              trigger="Add to list"
              chevron
              items={[
                { label: "Want to read", icon: ListPlus },
                { label: "Favourites", icon: Heart },
                { label: "Book club picks", icon: Star },
                { type: "separator" },
                { label: "New list…", icon: ListPlus },
              ]}
            />
          </>
        }
      />
      <section aria-labelledby="where" className="flex flex-col gap-2">
        <h2 id="where" className="border-b border-border pb-1 text-[16px] font-bold">
          Where to find it
        </h2>
        <LibraryCopiesTable copies={copies} branches={BRANCHES} digital={availability} today={TODAY} />
      </section>
      <LibraryShelf title="Similar titles" books={similarTo(b)} basePath={BASE} linkAs={Link} />
    </div>
  );
}
