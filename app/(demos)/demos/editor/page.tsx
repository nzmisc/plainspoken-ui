import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { EditorApp } from "@/registry/plainspoken/blocks/editor/editor-app";

export const metadata: Metadata = {
  title: "Editor",
  description:
    "Quire, a team handbook built from plainspoken-ui: a rich text editor with formatted, Markdown and preview modes, picture uploads, a toolbar and Markdown shortcuts, with pages and drafts in a sidebar.",
};

export default function EditorPage() {
  return <EditorApp defaultDocId="welcome" actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
