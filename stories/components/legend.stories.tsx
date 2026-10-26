import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CHART_TEXTURES, seriesStyle } from "@/registry/plainspoken/lib/chart-scale";
import { Legend, Swatch } from "@/registry/plainspoken/ui/legend";

const meta = {
  title: "Components/Charts/Legend",
  component: Legend,
  args: {
    items: [
      { key: "cpu", label: "CPU", ...seriesStyle(0), value: "3.2%" },
      { key: "mem", label: "RAM", ...seriesStyle(1), value: "17.6% (4.1 GiB of 23.5 GiB)" },
    ],
  },
  argTypes: { items: { control: false }, shape: { control: "inline-radio", options: ["line", "square"] } },
} satisfies Meta<typeof Legend>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Line keys show the series' dash pattern and marker as well as its colour, so they match the chart in grayscale too. */
export const Playground: Story = {};

/** All five slots, as the line and bar charts assign them. */
export const FiveSlots: Story = {
  args: { items: ["Web", "iOS", "Android", "Desktop", "API"].map((label, i) => ({ key: label, label, ...seriesStyle(i) })) },
};

/** Squares for bars and donut parts. */
export const SquareKeys: Story = {
  args: {
    shape: "square",
    items: [
      { key: "paid", label: "Paid", color: "var(--chart-1)", value: "$41,920" },
      { key: "open", label: "Open", color: "var(--chart-2)", value: "$6,180" },
    ],
  },
};

/** The textures of a textured bar chart. */
export const Textures: Story = {
  args: {
    shape: "square",
    items: CHART_TEXTURES.map((t, i) => ({ key: t, label: t, color: seriesStyle(i).color, texture: t })),
  },
};

/** One item per line with the values pushed right, for beside a donut. */
export const Stacked: Story = {
  args: {
    shape: "square",
    stacked: true,
    className: "w-56",
    items: [
      { key: "media", label: "Media", color: "var(--chart-1)", value: "182 GB" },
      { key: "backups", label: "Backups", color: "var(--chart-2)", value: "96 GB" },
      { key: "projects", label: "Projects", color: "var(--chart-3)", value: "41 GB" },
    ],
  },
};

export const Swatches: StoryObj = {
  render: () => (
    <p className="flex flex-wrap gap-4 text-[14px]">
      <span>
        <Swatch color="var(--chart-1)" /> square
      </span>
      <span>
        <Swatch color="var(--chart-2)" shape="line" /> line
      </span>
      <span>
        <Swatch color="var(--chart-3)" shape="line" dash="6 3" marker="triangle" /> dashed, with a marker
      </span>
      <span>
        <Swatch color="var(--chart-4)" texture="hatch" /> hatched
      </span>
    </p>
  ),
};

/**
 * A legend set beside other text on a baseline-aligned row: "Balance $15.15" and the muted text
 * share one baseline (an empty swatch, as the first flex item, would otherwise supply the
 * legend's baseline and push it about 3px down).
 */
export const BesideText: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-baseline gap-x-3 text-[14px]">
      <Legend items={[{ key: "bal", label: "Balance", color: "var(--chart-1)", value: "$15.15" }]} />
      <span className="text-[13px] text-muted-foreground tabular-nums">$9.85 used of $25.00 credit, $0.00 spent in this range</span>
    </div>
  ),
};
