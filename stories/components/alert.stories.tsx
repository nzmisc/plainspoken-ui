import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Zap } from "@/registry/plainspoken/lib/icons";
import { Alert, type AlertVariant } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";

const meta = {
  title: "Components/Feedback/Alert",
  component: Alert,
  args: { variant: "warning", title: "Storage 84% full", children: "41 GB of 50 GB used. Old exports are deleted after seven days." },
  argTypes: {
    variant: { control: "select", options: ["default", "info", "success", "warning", "destructive"] },
    icon: { control: false },
    actions: { control: false },
  },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: AlertVariant[] = ["default", "info", "success", "warning", "destructive"];

export const Playground: Story = {};

/** Five variants. The colour is on the border and the title; the symbol and the words say it too. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {VARIANTS.map((v) => (
        <Alert key={v} variant={v} title={`${v[0].toUpperCase()}${v.slice(1)} alert`}>
          The body stays in normal text, whatever the variant.
        </Alert>
      ))}
    </div>
  ),
};

/** Without a title the variant's word stands in ("Warning:"), so the state is always said. */
export const TitleOnlyAndDefaultTitles: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {VARIANTS.map((v) => (
        <Alert key={v} variant={v} />
      ))}
      <Alert variant="info" icon={Zap} title="A custom symbol" />
    </div>
  ),
};

/** Actions on the right (they wrap below on narrow screens) and a dismiss button. Destructive alerts are announced (role="alert"). */
export const ActionsAndDismiss: Story = {
  render: function Render() {
    const [shown, setShown] = useState(true);
    return shown ? (
      <Alert
        variant="destructive"
        title="Payment failed"
        actions={
          <>
            <Button>Details</Button>
            <Button variant="primary">Update card</Button>
          </>
        }
        onDismiss={() => setShown(false)}
      >
        The card ending 4242 was declined on 24 October. Update it before 1 November to keep your workspace.
      </Alert>
    ) : (
      <Button onClick={() => setShown(true)}>Show again</Button>
    );
  },
};

/** At phone width the actions drop under the text; the × stays top right. */
export const Narrow: Story = {
  ...ActionsAndDismiss,
  decorators: [(S) => <div className="w-[320px]"><S /></div>],
};
