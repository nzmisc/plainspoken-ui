import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GridApp } from "@/registry/plainspoken/blocks/grid/grid-app";

const meta: Meta<typeof GridApp> = {
  title: "Blocks/Data grid/Data grid app",
  component: GridApp,
  parameters: { layout: "fullscreen" },
  args: { className: "h-[720px]" },
};
export default meta;
type Story = StoryObj<typeof GridApp>;

/**
 * All orders. Switch views above the table; change a filter, the sort or the columns and the view
 * says "edited", with Revert and Save as view. Rows are drawn as they scroll into view.
 */
export const AllOrders: Story = {};

/** The Late view: worst first, then by the promised day. */
export const Late: Story = { args: { defaultViewId: "late" } };

/** The High value view: €300 and up, biggest first. */
export const HighValue: Story = { args: { defaultViewId: "high-value" } };

/** A phone: the toolbar wraps and the table scrolls both ways. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };
