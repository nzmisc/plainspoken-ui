import { EditorApp } from "@/registry/plainspoken/blocks/editor/editor-app";

/**
 * The whole handbook in a 640px box: open pages from the sidebar, edit them, start a new one, and
 * publish a draft. Narrow the window to see the sidebar become a drawer.
 */
export default function EditorAppDemo() {
  return <EditorApp defaultDocId="welcome" className="h-[640px] border border-border" />;
}
