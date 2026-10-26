import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdLegend } from "@/registry/plainspoken/blocks/erd/legend";

const meta: Meta<typeof ErdLegend> = {
  title: "Blocks/ERD/Legend",
  component: ErdLegend,
  argTypes: { notation: { control: "inline-radio", options: ["crow", "labels"] } },
  args: { notation: "crow", schemas: SHOP_MODEL.schemas, onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof ErdLegend>;

/** Crow's foot, with the schema colours and a ×. */
export const Playground: Story = {};

/** 1 and N labels, no schemas, no ×. */
export const Labels: Story = { args: { notation: "labels", schemas: [], onClose: undefined } };
