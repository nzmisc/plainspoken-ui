import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { GridApp } from "@/registry/plainspoken/blocks/grid/grid-app";

export const metadata: Metadata = {
  title: "Data grid",
  description:
    "Three thousand orders of an online shop in one table built from plainspoken-ui: Excel-style column filters, sorting by several columns, columns to show, hide and resize, saved views, totals, an order drawer, and export to the clipboard, Excel and CSV.",
};

export default function GridPage() {
  return <GridApp actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
