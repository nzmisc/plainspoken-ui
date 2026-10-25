import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 80},${26 - ((v - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg aria-hidden width={80} height={28} viewBox="0 0 80 28" className="block overflow-visible">
      <polyline points={pts} fill="none" stroke="var(--color-chart-1)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

const meta = {
  title: "Components/Data display/Stat",
  component: Stat,
  args: {
    label: "Revenue",
    value: "€12,400",
    change: { value: "8.2%", direction: "up", period: "vs last month" },
    hint: "Before refunds",
  },
  argTypes: { chart: { control: false } },
} satisfies Meta<typeof Stat>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Up and down, good and bad: the words and arrow say the direction, the colour says whether it is good news. */
export const Changes: Story = {
  render: () => (
    <StatGroup>
      <Stat label="Revenue" value="€12,400" change={{ value: "8.2%", direction: "up", period: "vs last month" }} />
      <Stat label="New customers" value="38" change={{ value: "5", direction: "down", period: "vs last month" }} />
      <Stat label="Response time" value="182 ms" change={{ value: "24 ms", direction: "down", sentiment: "good", period: "vs last week" }} />
      <Stat label="Error rate" value="0.4%" change={{ value: "0.1 pt", direction: "up", sentiment: "bad", period: "vs last week" }} />
    </StatGroup>
  ),
};

export const WithSparkline: Story = {
  args: { label: "Signups per day", value: "58", change: { value: "87%", direction: "up", period: "in 12 days" }, hint: undefined },
  render: (args) => <Stat {...args} chart={<Sparkline values={[31, 34, 29, 40, 38, 44, 41, 47, 52, 49, 55, 58]} />} className="max-w-xs" />,
};

/** StatGroup wraps: one column on phones, two on tablets, four (or `columns`) on wide screens. */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatGroup columns={3}>
        <Stat label="Seats" value="9 / 10" hint="1 invitation pending" />
        <Stat label="Storage" value="41 GB" hint="of 50 GB" />
        <Stat label="Open tickets" value="14" change={{ direction: "flat", period: "since yesterday" }} />
      </StatGroup>
      <StatGroup columns={5}>
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
          <Stat key={d} label={d} value={`${[312, 298, 340, 361, 287][i]}`} />
        ))}
      </StatGroup>
    </div>
  ),
};
