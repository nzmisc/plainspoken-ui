import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BarChart } from "@/registry/plainspoken/ui/bar-chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const meta = {
  title: "Components/Charts/Bar chart",
  component: BarChart,
  args: {
    label: "Orders per month, 2026",
    valueLabel: "Orders",
    categoryLabel: "Month",
    categories: MONTHS.slice(0, 10),
    series: [{ key: "orders", label: "Orders", values: [412, 388, 455, 501, 548, 532, 497, 476, 590, 634] }],
  },
  argTypes: {
    series: { control: false },
    categories: { control: false },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    dataTable: { control: "inline-radio", options: ["hidden", "details", "none"] },
  },
  decorators: [
    (S) => (
      <div className="max-w-2xl">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof BarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One series: values at the bar ends. Hover a column, or Tab to the chart and use the arrow keys
 * (Home/End, Escape); the values are read out as you go.
 */
export const Playground: Story = {};

const grouped = {
  label: "New subscriptions by plan, per quarter",
  valueLabel: "New subscriptions",
  categoryLabel: "Quarter",
  categories: ["Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"],
  series: [
    { key: "starter", label: "Starter", values: [1240, 1385, 1310, 1502] },
    { key: "team", label: "Team", values: [610, 702, 815, 940] },
    { key: "business", label: "Business", values: [88, 121, 164, 203] },
  ],
};

/** Grouped series: side by side in the legend's order, 2px apart. No values on the bars (too many numbers); the tooltip and table carry them. */
export const Grouped: Story = { args: grouped };

/** `textured`: stripes and dots on every series after the first, in the bars and the legend, for print and colour-blind readers. */
export const Textured: Story = { args: { ...grouped, textured: true } };

/** Five series, textured: every slot differs in colour and texture. */
export const FiveSeriesTextured: Story = {
  args: {
    label: "Tickets by channel and weekday",
    valueLabel: "Tickets",
    categoryLabel: undefined,
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    textured: true,
    series: ["Email", "Chat", "Phone", "Forum", "Social"].map((label, k) => ({
      key: label,
      label,
      values: [0, 1, 2, 3, 4].map((d) => Math.round((60 - k * 10) * (1 + Math.sin(d + k) * 0.3))),
    })),
  },
};

const pages: [string, number][] = [
  ["/docs/getting-started", 18420],
  ["/pricing", 12960],
  ["/blog/moving-off-the-cloud", 9815],
  ["/docs/api/authentication", 7302],
  ["/changelog", 5120],
  ["/docs/guides/importing-from-csv-and-spreadsheets", 4488],
  ["/about", 1975],
];

/** Horizontal: for long labels (cut with an ellipsis past 40% of the width, full text on hover) and rankings. */
export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    label: "Most viewed pages, last 30 days",
    valueLabel: "Views",
    categoryLabel: "Page",
    categories: pages.map(([p]) => p),
    series: [{ key: "views", label: "Views", values: pages.map(([, v]) => v) }],
    tickFormat: (v: number) => (v >= 1000 ? `${v / 1000}K` : String(v)),
    valueFormat: (v: number) => v.toLocaleString("en-US"),
  },
};

/** Horizontal and grouped. */
export const HorizontalGrouped: Story = { args: { ...grouped, orientation: "horizontal", textured: true } };

/** Negative values hang from the zero line; their labels go below. */
export const Negative: Story = {
  args: {
    label: "Net change in paying customers per week",
    valueLabel: "Customers gained or lost",
    categoryLabel: "Week starting",
    categories: ["Sep 7", "Sep 14", "Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19"],
    series: [{ key: "net", label: "Net change", values: [184, 92, -41, 37, -118, 63, 141] }],
    valueFormat: (v: number) => (v > 0 ? `+${v}` : String(v)),
    tickFormat: (v: number) => String(v),
  },
};

/** 60 days: the category labels thin out to every n-th, values that don't fit their column are left to the tooltip, and a missing day is a gap. */
export const ManyCategories: Story = {
  args: {
    label: "Sign-ups per day, September and October",
    valueLabel: "Sign-ups",
    categoryLabel: "Day",
    categories: Array.from({ length: 60 }, (_, i) => `Sep ${i + 1}`.replace(/Sep (3[1-9]|[4-6]\d)/, (_m, d) => `Oct ${Number(d) - 30}`)),
    series: [{ key: "s", label: "Sign-ups", values: Array.from({ length: 60 }, (_, i) => (i === 41 ? null : Math.round(40 + 25 * Math.sin(i / 4) + (i % 7) * 3))) }],
  },
};

/** The data under a "Data" disclosure, for everyone. */
export const DataTableVisible: Story = { args: { dataTable: "details" } };

export const Empty: Story = { args: { series: [{ key: "orders", label: "Orders", values: [] }], categories: [] } };

export const PhoneWidth: Story = {
  args: grouped,
  decorators: [
    (S) => (
      <div className="w-[343px]">
        <S />
      </div>
    ),
  ],
};
