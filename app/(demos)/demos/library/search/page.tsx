import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "@/registry/plainspoken/lib/icons";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Pagination } from "@/registry/plainspoken/ui/pagination";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { LibraryFacets, type FacetGroup } from "@/registry/plainspoken/blocks/library/facets";
import { FORMATS, FORMAT_LABELS, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { LibraryResultList } from "@/registry/plainspoken/blocks/library/result-list";
import { LibraryResultsBar } from "@/registry/plainspoken/blocks/library/results-bar";
import { LibrarySearchForm } from "@/registry/plainspoken/blocks/library/search-form";
import { BASE, BOOKS, BRANCHES, PATRON, TODAY, availabilityOf } from "../data";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";

export const metadata: Metadata = {
  title: "Search the catalogue",
  description: "Search the Lakemont Public Library catalogue by keyword, title, author or subject, and see which formats are on the shelf now.",
  alternates: { canonical: `${BASE}/search` },
};

const PAGE_SIZE = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** A plain substring match in the chosen field: enough for a demo catalogue of a couple of hundred titles */
function matches(b: LibraryBook, q: string, field: string): boolean {
  const s = q.toLowerCase();
  const fields =
    field === "title"
      ? [b.title, b.subtitle]
      : field === "author"
        ? [b.author]
        : field === "subject"
          ? b.subjects
          : [b.title, b.subtitle, b.author, b.description, ...b.subjects, b.language];
  return fields.some((f) => f?.toLowerCase().includes(s));
}

function facet(key: string, label: string, books: LibraryBook[], values: (b: LibraryBook) => string[], order?: string[]): FacetGroup {
  const counts = new Map<string, number>();
  for (const b of books) for (const v of values(b)) counts.set(v, (counts.get(v) ?? 0) + 1);
  const keys = order ? order.filter((k) => counts.has(k)) : [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
  return { key, label, options: keys.map((k) => ({ value: k, label: k, count: counts.get(k)! })) };
}

export default function SearchPage({ searchParams }: PageProps<"/demos/library/search">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] leading-tight font-bold">Search the catalogue</h1>
      <Suspense fallback={<Skeleton lines={12} />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const field = ["title", "author", "subject"].includes(one(sp.in)) ? one(sp.in) : "keyword";
  const sort = one(sp.sort) || (q ? "relevance" : "added");
  const found = (q ? BOOKS.filter((b) => matches(b, q, field)) : BOOKS.slice()).sort((a, b) =>
    sort === "added" || !q ? b.added.localeCompare(a.added) : 0,
  );
  const pageCount = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number(one(sp.page)) || 1));
  const shown = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const years = found.map((b) => b.year);
  const href = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (field !== "keyword") s.set("in", field);
    if (p > 1) s.set("page", String(p));
    return `${BASE}/search${s.size ? `?${s}` : ""}`;
  };
  return (
    <>
      <LibrarySearchForm action={`${BASE}/search`} defaultValue={q} defaultScope={field} className="max-w-3xl" />
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[15rem_minmax(0,1fr)]">
        <LibraryFacets
          key={`${q}/${field}`}
          branches={BRANCHES}
          years={{ min: Math.min(...years, 2026), max: Math.max(...years, 1600) }}
          groups={[
            facet("format", "Format", found, (b) => b.formats.map((f) => FORMAT_LABELS[f]), FORMATS.map((f) => FORMAT_LABELS[f])),
            facet("subject", "Subject", found, (b) => b.subjects),
            facet("audience", "Audience", found, (b) => [b.audience], ["Adult", "Teen", "Children"]),
            facet("language", "Language", found, (b) => [b.language]),
          ]}
          className="md:sticky md:top-2 md:self-start"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <LibraryResultsBar
            key={`${q}/${field}/${page}`}
            total={found.length}
            from={found.length ? (page - 1) * PAGE_SIZE + 1 : 0}
            to={Math.min(found.length, page * PAGE_SIZE)}
            query={q || undefined}
            filters={field !== "keyword" && q ? [`In: ${field[0].toUpperCase()}${field.slice(1)}`] : []}
            defaultSort={sort}
          />
          {found.length === 0 ? (
            <EmptyState
              icon={Search}
              bordered
              title={`Nothing matches “${q}”`}
              description="Check the spelling, search a different field, or ask us to buy it."
              actions={
                <Link href={`${BASE}/search`} className={linkVariants()}>
                  Browse the whole catalogue
                </Link>
              }
            />
          ) : (
            <LibraryResultList
              results={shown.map((b) => ({ book: b, availability: availabilityOf(b) }))}
              start={(page - 1) * PAGE_SIZE + 1}
              basePath={BASE}
              linkAs={Link}
              branches={BRANCHES}
              defaultBranch={PATRON.homeBranch}
              today={TODAY}
            />
          )}
          {pageCount > 1 && <Pagination page={page} pageCount={pageCount} href={href} linkAs={Link} total={found.length} pageSize={PAGE_SIZE} label="Result pages" />}
        </div>
      </div>
    </>
  );
}
