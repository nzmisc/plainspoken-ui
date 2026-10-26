import { KITCHEN_SINK } from "@/registry/plainspoken/blocks/milkdown/data";
import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

/** Everything Markdown can say, in Write mode: switch to Markdown and back, and nothing is lost. */
export default function MilkdownEditorKitchenSink() {
  return <MilkdownEditor aria-label="Every Markdown element" defaultValue={KITCHEN_SINK} contentClassName="max-h-[640px]" />;
}
