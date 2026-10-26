import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

const NOTE = `## Rota changes from March

From the first week of March the **early shift** starts at 06:30, not 06:00, and the late shift runs until *21:00*. Swap requests go through the [rota board](https://rota.fernhill.example/swaps) as before.

- The weekend on-call pair stays the same
- Cover for the depot desk is now two people on Mondays
- [ ] Check your March shifts by Friday

Type **/** at the start of a line for headings, lists, tables, pictures and math.`;

/**
 * A team note in the formatted Write mode. Select words for the bubble, type "/" on a new line for
 * the block menu, hover a paragraph for its handle (drag it, or click it for its menu), and switch
 * to Markdown or Preview.
 */
export default function MilkdownEditorDemo() {
  return <MilkdownEditor aria-label="Team note" defaultValue={NOTE} className="max-w-2xl" />;
}
