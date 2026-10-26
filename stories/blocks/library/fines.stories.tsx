import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryFines } from "@/registry/plainspoken/blocks/library/fines";
import { FINES } from "./fixtures";

const meta: Meta<typeof LibraryFines> = {
  title: "Blocks/Library/Fines",
  component: LibraryFines,
  args: { fines: FINES },
};
export default meta;
type Story = StoryObj<typeof LibraryFines>;

/** Some owed, some paid. */
export const Owed: Story = {};

/** Over the limit: borrowing is paused. */
export const OverLimit: Story = { args: { fines: [...FINES, { id: "f5", date: "2026-10-01", description: "Lost item", title: "Dune", amount: 18, paid: false }] } };

/** Everything paid. */
export const Paid: Story = { args: { fines: FINES.map((f) => ({ ...f, paid: true })) } };
