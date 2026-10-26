import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdTableList } from "@/registry/plainspoken/blocks/erd/table-list";

/** Escape in the search box clears it. */
const meta: Meta<typeof ErdTableList> = {
  title: "Blocks/ERD/Table list",
  component: ErdTableList,
  args: { model: SHOP_MODEL, onPick: () => {}, selected: ["sales.orders"], className: "h-[32rem] w-60 border border-border" },
  argTypes: { model: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ErdTableList>;

/** 28 tables in four schemas, orders selected. */
export const Playground: Story = {};

/** Searching for a column: the tables that have it, with the column named. */
export const ColumnSearch: Story = { args: { defaultQuery: "email" } };

/** Nothing matches. */
export const NoMatch: Story = { args: { defaultQuery: "invoice" } };

/** An empty schema. */
export const Empty: Story = { args: { model: { name: "empty", schemas: [], tables: [], relations: [] } } };
