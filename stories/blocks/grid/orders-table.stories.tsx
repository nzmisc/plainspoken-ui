import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GRID_NOW } from "@/registry/plainspoken/blocks/grid/data";
import { GridOrdersTable } from "@/registry/plainspoken/blocks/grid/orders-table";

const meta: Meta<typeof GridOrdersTable> = {
  title: "Blocks/Data grid/Orders table",
  component: GridOrdersTable,
  parameters: { layout: "padded" },
  args: { maxHeight: "32rem", now: GRID_NOW },
};
export default meta;
type Story = StoryObj<typeof GridOrdersTable>;

/**
 * Three thousand orders, 50 to a page, newest first, with totals under the table. Keyboard: Tab
 * to a header and press Enter to sort, Alt+↓ for its filter; Tab once more to its right edge and
 * use ← → to resize it.
 */
export const AllOrders: Story = {};

/** Late Northpost orders, worst first and then the biggest: a values filter, a condition, two sort levels. */
export const Filtered: Story = {
  args: {
    initialFilters: {
      carrier: { kind: "values", values: ["Northpost"] },
      late: { kind: "conditions", conditions: [{ op: "gte", value: "1" }] },
    },
    initialSort: [
      { key: "late", dir: "desc" },
      { key: "total", dir: "desc" },
    ],
  },
};

/** This month's orders above €200, a date period and a number condition. */
export const ThisMonthOver200: Story = {
  args: {
    initialFilters: {
      placed: { kind: "conditions", conditions: [{ op: "period", period: "thisMonth" }] },
      total: { kind: "conditions", conditions: [{ op: "gt", value: "200" }] },
    },
  },
};

/** Every row on one page (pageSizes [0]): the case to watch for speed. */
export const OnePage: Story = { args: { pageSizes: [0], maxHeight: "40rem" } };
