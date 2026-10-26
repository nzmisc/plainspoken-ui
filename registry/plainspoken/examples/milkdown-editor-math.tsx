import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

const MATH = `Each courier's share of the tips is $s_i = \\frac{h_i}{\\sum_j h_j} \\cdot T$, where $h_i$ is hours worked and $T$ the week's tips.

For the van's range we use:

$$
R = \\frac{E_\\text{battery} \\cdot \\eta}{c_\\text{km}}
$$

Type \`$x^2$\` in a line, or \`$$\` and Enter on a line of its own.`;

/**
 * Math through remark-math: inline $…$ and blocks $$…$$, drawn with KaTeX. Click a formula, or
 * move onto it with the arrows, to write its TeX; a block shows it drawn as you type. Enter or
 * Escape leaves an inline formula, Escape or ⌘Enter a block.
 */
export default function MilkdownEditorMath() {
  return <MilkdownEditor aria-label="Tips and range" defaultValue={MATH} className="max-w-2xl" />;
}
