import { DOCS } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocument } from "@/registry/plainspoken/blocks/editor/document";

/**
 * The offsite plan, a draft, in a 560px box: write, and it "saves" a moment after you stop. Paste
 * or drop a picture to see the pretend upload; a file with "fail" in its name fails.
 */
export default function EditorDocumentDemo() {
  return <EditorDocument doc={DOCS.find((d) => d.id === "offsite")!} className="h-[560px] border border-border" />;
}
