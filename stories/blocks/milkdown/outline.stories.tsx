import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { outline } from "@/registry/plainspoken/blocks/milkdown/format";
import { NotebookOutline, OutlineMenu } from "@/registry/plainspoken/blocks/milkdown/outline";

const entries = (id: string) => outline(PAGES.find((p) => p.id === id)!.body);

const meta: Meta<typeof NotebookOutline> = {
  title: "Blocks/Editor (Milkdown)/Outline",
  component: NotebookOutline,
  args: { entries: entries("validator-latency"), current: 1, onSelect: () => {}, className: "w-60" },
};
export default meta;
type Story = StoryObj<typeof NotebookOutline>;

/** The runbook's headings, the second being read. Tab to an entry; Enter chooses it. */
export const Rail: Story = {};

/** Every Markdown element: three levels of heading, indented. */
export const ThreeLevels: Story = { args: { entries: entries("every-element"), current: 4 } };

/** A page without headings. */
export const NoHeadings: Story = { args: { entries: [] } };

/** The menu used below xl widths, from an icon button in the page header. */
export const Menu: Story = { render: (args) => <OutlineMenu entries={args.entries} current={args.current} onSelect={args.onSelect} /> };
