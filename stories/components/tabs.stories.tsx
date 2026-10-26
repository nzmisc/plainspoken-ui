import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Tabs, type TabItem } from "@/registry/plainspoken/ui/tabs";
import { Measure } from "../support/measure";

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", content: <p>Ubuntu 26.04, 8 vCPU, 24 GB. Private network only.</p> },
  { id: "services", label: "Services", count: 6, content: <p>Web front end, code editor, remote desktop, file shares, SSH, dashboard.</p> },
  { id: "logs", label: "Logs", count: 2, content: <pre className="overflow-x-auto text-[13px]">Oct 19 07:41 dashboard[812]: listening on 127.0.0.1:8790</pre> },
  { id: "billing", label: "Billing", disabled: true, content: null },
  { id: "settings", label: "Settings", content: <p>Nothing to set yet.</p> },
];

const meta = {
  title: "Components/Navigation/Tabs",
  component: Tabs,
  args: { label: "Machine", tabs: TABS, variant: "boxed" },
  argTypes: {
    variant: { control: "inline-radio", options: ["boxed", "plain"] },
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
  },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Tab into the strip, then ←/→, Home, End select as they move; Tab again goes into the panel. Disabled tabs are skipped. */
export const Boxed: Story = {};

export const Plain: Story = { args: { variant: "plain" } };

/** The strip scrolls sideways when the tabs don't fit. */
export const ManyTabs: Story = {
  args: {
    tabs: ["Overview", "CPU", "Memory", "Disks", "Network", "Services", "Logs", "Users", "Backups"].map((t) => ({
      id: t,
      label: t,
      content: <p>{t}</p>,
    })),
  },
  decorators: [(S) => <div className="w-[320px]"><S /></div>],
};

/** The tabs sit on the control height scale. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-4">
        {CONTROL_SIZES.map((s) => (
          <Tabs key={s} size={s} label={`Size ${s}`} tabs={TABS.slice(0, 3)} />
        ))}
      </div>
    </Measure>
  ),
};
