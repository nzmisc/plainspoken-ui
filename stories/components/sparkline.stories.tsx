import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkline } from "@/registry/plainspoken/ui/sparkline";

const RPM = [820, 860, 910, 870, 940, 1010, 980, 1050, 1120, 1080, 1150, 1210];

const meta = {
  title: "Components/Charts/Sparkline",
  component: Sparkline,
  args: { values: RPM, label: "Requests per minute, last hour" },
  argTypes: { values: { control: false }, type: { control: "inline-radio", options: ["line", "bar"] } },
} satisfies Meta<typeof Sparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A line ending in a dot on the latest value. Its accessible name (and hover title) says first, last, low and high. */
export const Playground: Story = {};

export const WithArea: Story = { args: { area: true, width: 120, height: 32 } };

/** Bars for counts per period: the latest in full colour, the rest lighter. Zero is a hairline at the base. */
export const Bars: Story = { args: { type: "bar", values: [0, 0, 0, 4, 9, 6, 1, 0, 0, 0, 2, 3], label: "Errors per 5 minutes", color: "var(--chart-2)" } };

/** Missing values are gaps, in the line and its area. */
export const Gaps: Story = { args: { values: [300, 310, null, null, 290, 305, 320, null, 330, 325, 340, 352], area: true } };

/** Its own words instead of the numbers, e.g. a change against a period. */
export const CustomSummary: Story = { args: { summary: "up 48% on the hour before" } };

/** Inside running text, at the text's size. */
export const InText: StoryObj = {
  render: () => (
    <p className="max-w-md text-[14px]">
      Requests rose all hour <Sparkline values={RPM} label="Requests per minute, last hour" width={48} height={14} /> to 1,210 a minute, while
      errors stayed flat <Sparkline type="bar" values={[1, 0, 0, 2, 1, 0, 0, 1, 0, 0, 1, 0]} label="Errors per 5 minutes" width={48} height={14} color="var(--chart-2)" />.
    </p>
  ),
};

export const NoData: Story = { args: { values: [] } };
