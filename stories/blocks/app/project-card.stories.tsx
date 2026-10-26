import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PROJECTS } from "@/registry/plainspoken/blocks/app/data";
import { AppProjectCard } from "@/registry/plainspoken/blocks/app/project-card";

const meta: Meta<typeof AppProjectCard> = {
  title: "Blocks/App skeleton/Project card",
  component: AppProjectCard,
  decorators: [(S) => <div className="max-w-xs">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppProjectCard>;

const p = (id: string) => PROJECTS.find((x) => x.id === id)!;

/** On track. */
export const OnTrack: Story = { args: { project: p("p-fjord-catalogue") } };

/** Due soon and nearly out of budget: amber, with a warning symbol and the word on the meter. */
export const NearlyOver: Story = { args: { project: p("p-pinecrest-booking") } };

/** Over budget: red, with an error symbol. */
export const OverBudget: Story = { args: { project: p("p-harbor-winter") } };

/** Not started. */
export const Planned: Story = { args: { project: p("p-northwind-shop") } };
