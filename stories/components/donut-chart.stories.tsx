import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DonutChart } from "@/registry/plainspoken/ui/donut-chart";

const meta = {
  title: "Components/Charts/Donut chart",
  component: DonutChart,
  args: {
    label: "Claude weekly allowance",
    format: (v: number) => `${v}%`,
    segments: [
      { key: "left", label: "Left", value: 91, color: "var(--chart-1)" },
      { key: "used", label: "Used", value: 9, color: "var(--accent)" },
    ],
    children: (
      <>
        <b className="text-[15px]">91%</b>
        <span className="text-[12px] text-muted-foreground">left</span>
      </>
    ),
  },
  argTypes: { segments: { control: false }, children: { control: false } },
} satisfies Meta<typeof DonutChart>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What is left of a quota (in colour) against what is used (gray). The number in the hole is the point; screen readers get both parts in the ring's name. */
export const Playground: Story = {};

export const AlmostEmpty: Story = {
  args: {
    segments: [
      { key: "left", label: "Left", value: 2, color: "var(--chart-1)" },
      { key: "used", label: "Used", value: 98, color: "var(--accent)" },
    ],
    children: <b className="text-[15px]">2%</b>,
  },
};

/** One part: a full ring, no gap. */
export const Full: Story = {
  args: { segments: [{ key: "left", label: "Left", value: 100 }], children: <b className="text-[15px]">100%</b> },
};

/** No data: an empty gray ring. */
export const NoData: Story = { args: { segments: [], children: <b>–</b> } };

/** Three or more parts get the legend, with values and shares, so no part is told by colour alone. */
export const WithLegend: Story = {
  args: {
    label: "Invoices by status, October 2026",
    format: (v: number) => `$${v.toLocaleString("en-US")}`,
    size: 120,
    thickness: 18,
    segments: [
      { key: "paid", label: "Paid", value: 41920 },
      { key: "open", label: "Open", value: 6180 },
      { key: "overdue", label: "Overdue", value: 1240 },
      { key: "draft", label: "Draft", value: 2310 },
    ],
    children: (
      <>
        <b className="text-[15px]">$51.7K</b>
        <span className="text-[12px] text-muted-foreground">invoiced</span>
      </>
    ),
  },
};

/** Five parts, a tiny one among them: every part keeps at least a sliver, with 2px gaps between. */
export const FiveParts: Story = {
  args: {
    label: "Disk use by folder",
    format: (v: number) => `${v} GB`,
    size: 140,
    thickness: 22,
    segments: [
      { key: "media", label: "Media", value: 182 },
      { key: "backups", label: "Backups", value: 96 },
      { key: "projects", label: "Projects", value: 41 },
      { key: "mail", label: "Mail", value: 12 },
      { key: "other", label: "Other", value: 1 },
    ],
    children: undefined,
  },
};

export const Small: Story = { args: { size: 48, thickness: 7, children: <b className="text-[11px]">91%</b> } };
