import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { NotebookApp } from "@/registry/plainspoken/blocks/milkdown/notebook-app";

export const metadata: Metadata = {
  title: "Editor (Milkdown)",
  description:
    "Pennant's engineering notebook, built from plainspoken-ui on the Milkdown editor: RFCs, runbooks and incident reviews with a slash menu, draggable blocks, tables, code, math and footnotes, a page tree with search, and an outline that follows the reading.",
};

export default function MilkdownPage() {
  return <NotebookApp storageKey="pennant-notebook" actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
