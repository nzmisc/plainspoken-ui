import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { searchPages } from "@/registry/plainspoken/blocks/milkdown/format";
import { NewPageMenu, PageTreeHeader, notebookSections } from "@/registry/plainspoken/blocks/milkdown/page-tree";
import { Sidebar } from "@/registry/plainspoken/ui/sidebar";

function Tree({ defaultQuery = "", rail = false }: { defaultQuery?: string; rail?: boolean }) {
  const [query, setQuery] = useState(defaultQuery);
  const [current, setCurrent] = useState("validator-latency");
  const matches = useMemo(() => searchPages(PAGES, query), [query]);
  return (
    <Sidebar
      label="Notebook pages"
      rail={rail}
      sections={notebookSections(PAGES, matches)}
      current={current}
      onNavigate={setCurrent}
      header={(r) => <PageTreeHeader rail={r} query={query} onQueryChange={setQuery} count={matches ? matches.size : null} onCreate={() => {}} />}
      className="h-[600px] border border-border"
    />
  );
}

const meta: Meta<typeof Tree> = {
  title: "Blocks/Editor (Milkdown)/Page tree",
  component: Tree,
};
export default meta;
type Story = StoryObj<typeof Tree>;

/** The tree by part, the Runbooks folder open around the current page. Type to search; Escape clears. */
export const Playground: Story = {};

/** Searching "validator": the pages that match, each with its count. */
export const Searching: Story = { args: { defaultQuery: "validator" } };

/** Nothing matches. */
export const NoMatches: Story = { args: { defaultQuery: "timetable" } };

/** The rail: icons only, with New page as an icon button. */
export const Rail: Story = { args: { rail: true } };

/** New page on its own, open: the templates with what each is for. */
export const Templates: Story = {
  render: () => (
    <div className="w-60">
      <NewPageMenu onCreate={() => {}} />
    </div>
  ),
};
