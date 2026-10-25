import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErdRelationLines } from "@/registry/plainspoken/blocks/erd/relation-lines";
import Demo from "@/registry/plainspoken/examples/erd-relation-lines-demo";
import Labels from "@/registry/plainspoken/examples/erd-relation-lines-labels";

/** Lines under fixed tables, as in the docs. In the diagram they follow the tables as they're dragged. */
const meta: Meta<typeof ErdRelationLines> = {
  title: "Blocks/ERD/Relationship lines",
  component: ErdRelationLines,
};
export default meta;
type Story = StoryObj<typeof ErdRelationLines>;

/** Crow's foot marks, right angles. */
export const CrowsFoot: Story = { render: () => <Demo /> };

/** 1 and N labels, curves, highlighted. */
export const LabelsAndCurves: Story = { render: () => <Labels /> };
