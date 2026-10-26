import type { Metadata } from "next";
import { DemoBar } from "@/components/site/demo-bar";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { LibraryHeader } from "@/registry/plainspoken/blocks/library/header";
import { BASE, LIBRARY_NAME, PATRON } from "./data";
import { NextLink as Link } from "@/registry/plainspoken/lib/next-link";

export const metadata: Metadata = {
  title: { default: LIBRARY_NAME, template: `%s · ${LIBRARY_NAME}` },
  description: "The online catalogue of the Lakemont Public Library: search books, e-books, audiobooks and DVDs at four branches, place holds and manage your loans.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="library" />
      <LibraryHeader basePath={BASE} linkAs={Link} name={LIBRARY_NAME} patron={PATRON.name} />
      <main id="content" className="mx-auto w-full max-w-6xl px-3 pt-4 pb-10 sm:px-6 sm:pt-6">
        {children}
      </main>
      <footer className="border-t border-border bg-muted px-3 py-3 text-[13px] text-muted-foreground sm:px-6">
        <p className="mx-auto max-w-6xl">
          {LIBRARY_NAME} is made up for this demo, and so are its branches, copies and patrons. The books are real; their descriptions were written for
          the demo.
        </p>
      </footer>
      <Toaster />
    </>
  );
}
