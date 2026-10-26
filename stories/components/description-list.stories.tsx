import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { DescriptionItem, DescriptionList } from "@/registry/plainspoken/ui/description-list";

const ITEMS = [
  { term: "Host", description: <code className="font-mono text-[13px]">web-01</code> },
  { term: "OS", description: "Ubuntu 26.04.1 LTS, kernel 7.0" },
  { term: "Hardware", description: "8 vCPU, 24 GB RAM, 290 GB disk" },
  { term: "Status", description: <Badge variant="success">running</Badge> },
  { term: "A longer term that wraps", description: "Terms get at most 16rem; longer ones wrap." },
];

const meta = {
  title: "Components/Data display/Description list",
  component: DescriptionList,
  args: { items: ITEMS, layout: "side", divided: false },
  argTypes: { layout: { control: "inline-radio", options: ["side", "stacked"] } },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof DescriptionList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Side by side from sm up; on phones each term goes above its description. */
export const Playground: Story = {};

export const Divided: Story = { args: { divided: true } };

export const Stacked: Story = { args: { layout: "stacked", divided: true }, decorators: [(S) => <div className="max-w-xs"><S /></div>] };

export const Children: Story = {
  render: () => (
    <DescriptionList>
      <DescriptionItem term="Plan">Team, yearly</DescriptionItem>
      <DescriptionItem term="Renews">1 March 2027</DescriptionItem>
    </DescriptionList>
  ),
};

export const Phone: Story = { parameters: { viewport: { defaultViewport: "iphoneSE" } } };
