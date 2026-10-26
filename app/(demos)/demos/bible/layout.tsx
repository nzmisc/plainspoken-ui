import type { Metadata } from "next";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";
import { DemoBar } from "@/components/site/demo-bar";
import { BibleHeader } from "@/registry/plainspoken/blocks/bible/header";
import { BASE } from "./data";

export const metadata: Metadata = {
  title: { default: "King James Bible", template: "%s · King James Bible" },
  description: "The whole King James Version: all 66 books and 1,189 chapters, set for reading, with full-text search.",
};

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="bible" />
      <BibleHeader basePath={BASE} linkAs={Link} />
      <main id="content" className="mx-auto w-full max-w-5xl px-3 pt-4 pb-10 sm:px-6 sm:pt-6">
        {children}
      </main>
      <footer className="border-t border-border bg-muted px-3 py-3 text-[13px] text-muted-foreground sm:px-6">
        <p className="mx-auto max-w-5xl">
          The King James Version, in the standardized text of 1769. Public domain (in the United Kingdom, Crown letters patent).
          Text from{" "}
          <a href="https://ebible.org/find/details.php?id=eng-kjv" className="text-link underline visited:text-link-visited">
            eBible.org
          </a>
          .
        </p>
      </footer>
    </>
  );
}
