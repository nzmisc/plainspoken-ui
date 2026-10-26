import { KITCHEN_SINK } from "@/registry/plainspoken/blocks/editor/data";
import { RichTextEditor } from "@/registry/plainspoken/ui/rich-text-editor";

/**
 * Every element the editor's Markdown knows, on one page: text marks, breaks, escapes, links of
 * each kind, six headings, nested and task lists, quotes, three kinds of code block, pictures, a
 * table and rules, and raw HTML shown as text. Look at it in each mode.
 */
export default function RichTextEditorKitchenSink() {
  return <RichTextEditor aria-label="Markdown kitchen sink" defaultValue={KITCHEN_SINK} measure contentClassName="max-h-[640px]" />;
}
