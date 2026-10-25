import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";

/** Point at a mark, a row or the header for what it means and the comments. The fold button shows only the keys. */
const meta: Meta<typeof ErdTableCard> = {
  title: "Blocks/ERD/Table node",
  component: ErdTableCard,
  args: { model: SHOP_MODEL, table: tableById(SHOP_MODEL, "sales.orders"), onCollapsedChange: () => {} },
  argTypes: { model: { control: false }, table: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ErdTableCard>;

/** orders: a primary key, four foreign keys (one nullable), unique, defaults, indexes. Collapse and the display flags in the Controls panel. */
export const Playground: Story = {};

/** Folded to its keys: the hidden columns are counted. */
export const Collapsed: Story = { args: { collapsed: true } };

/** No types and no NULL marks. */
export const Plain: Story = { args: { showTypes: false, showNullability: false } };

/** A composite primary key whose columns are also foreign keys: both icons. */
export const CompositeKey: Story = { args: { table: tableById(SHOP_MODEL, "fulfilment.inventory") } };

/** Identity keys (ID) and a self-reference. */
export const Identity: Story = { args: { table: tableById(SHOP_MODEL, "catalog.categories") } };

/** Rows of a highlighted relation, and the drop target of a connection drag. */
export const Highlighted: Story = { args: { highlightColumns: ["customer_id"], dropColumn: "discount_id", onConnectStart: () => {} } };

/** Faded, while another table is highlighted. */
export const Dimmed: Story = { args: { dimmed: true } };

/** A long name and a long type. */
export const LongNames: Story = {
  args: {
    table: {
      id: "x",
      schema: "reporting",
      name: "monthly_revenue_by_region_and_channel",
      indexes: [],
      columns: [
        { name: "id", type: "bigint", pk: true, identity: true },
        { name: "region_code_including_subdivision", type: "character varying(64)", notNull: true },
        { name: "amount", type: "numeric(14,2)" },
      ],
    },
  },
};
