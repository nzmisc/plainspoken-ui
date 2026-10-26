import type { Metadata } from "next";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";
import { Suspense } from "react";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";
import type { Testament } from "@/registry/plainspoken/blocks/bible/lib";
import { BibleSearchForm } from "@/registry/plainspoken/blocks/bible/search-form";
import { BibleSearchResults } from "@/registry/plainspoken/blocks/bible/search-results";
import { BASE, SEARCH, searchKjv } from "../data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search all 31,102 verses of the King James Bible for words, phrases or a reference such as John 3:16.",
  alternates: { canonical: SEARCH },
};

const EXAMPLES = ["still small voice", "“the valley of the shadow”", "charity", "John 3:16", "Ps 23"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function SearchPage({ searchParams }: PageProps<"/demos/bible/search">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] leading-tight font-bold">Search the Bible</h1>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <BibleSearchForm action={SEARCH} />
            <Skeleton lines={10} />
          </div>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 200);
  const t = one(sp.t);
  const testament = t === "OT" || t === "NT" ? (t as Testament) : undefined;
  const result = await searchKjv(q, testament, one(sp.book) || undefined, Number(one(sp.page)) || 1);
  return (
    <div className="flex flex-col gap-4">
      <BibleSearchForm action={SEARCH} defaultValue={q} testament={testament} autoFocus={!q} />
      <BibleSearchResults
        result={result}
        basePath={BASE}
        searchPath={SEARCH}
        linkAs={Link}
        intro={
          <div className="flex max-w-[68ch] flex-col gap-2 text-[14px]">
            <p>
              Every word must be in the same verse, and a word finds its endings too: <i>love</i> finds loved, loveth and lovest. Put
              words in quotes for an exact phrase. A reference such as <i>John 3:16</i> or <i>Ps 23</i> takes you to it.
            </p>
            <p>
              Try:{" "}
              {EXAMPLES.map((e, i) => (
                <span key={e}>
                  {i > 0 && ", "}
                  <Link href={`${SEARCH}?q=${encodeURIComponent(e.replace(/[“”]/g, '"'))}`} className="text-link underline visited:text-link-visited">
                    {e}
                  </Link>
                </span>
              ))}
              .
            </p>
          </div>
        }
      />
    </div>
  );
}
