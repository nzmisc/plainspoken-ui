"use client";

import { useMemo, useState } from "react";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { searchPages } from "@/registry/plainspoken/blocks/milkdown/format";
import { PageTreeHeader, notebookSections } from "@/registry/plainspoken/blocks/milkdown/page-tree";
import { Sidebar } from "@/registry/plainspoken/ui/sidebar";

/**
 * The notebook's pages in a Sidebar, by part, with Runbooks and On-call as folders. Search for
 * "validator" or "bundle": the tree becomes a list of the pages that match, with how often.
 */
export default function MilkdownPageTreeDemo() {
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState("validator-latency");
  const matches = useMemo(() => searchPages(PAGES, query), [query]);
  return (
    <Sidebar
      label="Notebook pages"
      sections={notebookSections(PAGES, matches)}
      current={current}
      onNavigate={setCurrent}
      header={<PageTreeHeader query={query} onQueryChange={setQuery} count={matches ? matches.size : null} onCreate={() => {}} />}
      className="h-[560px] border border-border"
    />
  );
}
