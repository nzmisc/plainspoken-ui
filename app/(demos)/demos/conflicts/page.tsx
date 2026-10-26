import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { ConflictsApp } from "@/registry/plainspoken/blocks/conflicts/conflicts-app";

export const metadata: Metadata = {
  title: "Edit conflicts",
  description:
    "Prototypes of what to show when two people change the same text at once, for a text box and a rich text document: presence and soft locks, warnings while typing, conflicts on save, automatic three-way merges, inline conflict blocks, a compare dialog, an offline review list and version history.",
};

export default function ConflictsPage() {
  return <ConflictsApp actions={<ThemeToggle size="sm" />} />;
}
