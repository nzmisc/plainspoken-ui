import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LineChart, type LinePoint, type LineSeries } from "@/registry/plainspoken/ui/line-chart";

/** Fixed, so screenshots don't change from day to day */
const NOW = Date.UTC(2026, 9, 19, 12, 0);
const MIN = 60_000;

function wave(n: number, stepMs: number, f: (i: number) => number | null): LinePoint[] {
  return Array.from({ length: n }, (_, i) => ({ t: NOW - (n - 1 - i) * stepMs, v: f(i) }));
}

const cpuRam: LineSeries[] = [
  { key: "cpu", label: "CPU", points: wave(121, 5000, (i) => 20 + 15 * Math.sin(i / 8) + (i % 7)) },
  { key: "ram", label: "RAM", points: wave(121, 5000, (i) => 45 + i / 10) },
];

const meta = {
  title: "Components/Charts/Line chart",
  component: LineChart,
  args: {
    label: "CPU and RAM of web-01, last 10 minutes",
    xDomain: [NOW - 10 * MIN, NOW],
    yDomain: [0, 100],
    yTicks: [0, 25, 50, 75, 100],
    yFormat: (v: number) => `${v}%`,
    valueFormat: (v: number) => `${v.toFixed(1)}%`,
    gapMs: 20_000,
    series: cpuRam,
  },
  argTypes: {
    series: { control: false },
    xDomain: { control: false },
    dataTable: { control: "inline-radio", options: ["hidden", "details", "none"] },
    markers: { control: "inline-radio", options: [undefined, "all", "end", "none"] },
    legend: { control: "inline-radio", options: [true, false, "latest"] },
  },
  decorators: [
    (S) => (
      <div className="max-w-3xl">
        <S />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two percentage series over 10 minutes. Hover for the crosshair, or Tab to the chart and use
 * Left/Right (Home/End, Escape): the values are read out as you go.
 */
export const Playground: Story = {};

/** Missing samples are gaps, not joined across. A sample with no neighbours shows as a marker. */
export const WithGaps: Story = {
  args: {
    series: [
      {
        key: "cpu",
        label: "CPU",
        points: wave(121, 5000, (i) => ((i > 30 && i < 50) || i === 70 || (i > 71 && i < 90) ? null : 30 + 10 * Math.sin(i / 5))),
      },
    ],
  },
};

/** One series in dollars over a week; the value axis is automatic from zero and the legend is off (the label names the series). */
export const Dollars: Story = {
  args: {
    label: "Prepaid credit balance, last 7 days",
    xDomain: [NOW - 7 * 1440 * MIN, NOW],
    yDomain: undefined,
    yTicks: undefined,
    yLabel: "Balance (USD)",
    yFormat: (v: number) => `$${v}`,
    valueFormat: (v: number) => `$${v.toFixed(2)}`,
    gapMs: 3 * 3600_000,
    series: [{ key: "bal", label: "Balance", points: wave(7 * 24, 3600_000, (i) => 25 - i * 0.055 - (i % 9) * 0.02) }],
  },
};

/** Five series: each slot has its own colour, line pattern and marker, and the legend shows all three. */
export const FiveSeries: Story = {
  args: {
    label: "Weekly downloads by package",
    xDomain: undefined,
    yDomain: undefined,
    yTicks: undefined,
    gapMs: undefined,
    yFormat: (v: number) => (v >= 1000 ? `${v / 1000}K` : String(v)),
    valueFormat: (v: number) => v.toLocaleString("en-US"),
    legend: "latest",
    series: ["core", "cli", "react", "vue", "svelte"].map((name, k) => ({
      key: name,
      label: `@acme/${name}`,
      points: wave(12, 7 * 1440 * MIN, (i) => Math.round((9 - k * 1.6) * 1000 * (1 + i * (0.02 + k * 0.012)) + Math.sin(i + k) * 300)),
    })),
  },
};

/** A fresh database: one sample each. The markers keep them visible. */
export const OnePoint: Story = {
  args: {
    series: [
      { key: "a", label: "Claude", points: [{ t: NOW - 30_000, v: 91 }] },
      { key: "b", label: "Cursor", points: [{ t: NOW - 30_000, v: 97 }] },
    ],
  },
};

export const Empty: Story = { args: { series: [{ key: "cpu", label: "CPU", points: [] }] } };

/** The data under a "Data" disclosure, for everyone; by default the same table is there only for screen readers. */
export const DataTableVisible: Story = { args: { dataTable: "details", height: 140, series: cpuRam.map((s) => ({ ...s, points: s.points.filter((_, i) => i % 12 === 0) })) } };

/** The legend can carry each series' latest value. */
export const LatestInLegend: Story = { args: { legend: "latest" } };

export const Tall: Story = { args: { height: 320 } };

/** Phone width: fewer time ticks; the tooltip flips to the left of the crosshair near the right edge. */
export const PhoneWidth: Story = {
  decorators: [
    (S) => (
      <div className="w-[343px]">
        <S />
      </div>
    ),
  ],
};
