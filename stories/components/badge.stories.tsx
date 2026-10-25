import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkles } from "@/registry/plainspoken/lib/icons";
import { Badge, type BadgeVariant } from "@/registry/plainspoken/ui/badge";

const meta = {
  title: "Components/Feedback/Badge",
  component: Badge,
  args: { variant: "success", children: "running", solid: false },
  argTypes: {
    variant: { control: "select", options: ["default", "info", "success", "warning", "destructive"] },
    icon: { control: false },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: BadgeVariant[] = ["default", "info", "success", "warning", "destructive"];

export const Playground: Story = {};

/** Outlined and solid. Coloured variants carry a symbol, so colour is never the only signal. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
      </p>
      <p className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((v) => (
          <Badge key={v} variant={v} solid>
            {v}
          </Badge>
        ))}
      </p>
      <p className="flex flex-wrap items-center gap-2">
        <Badge variant="info" icon={Sparkles}>
          new
        </Badge>
        <Badge variant="destructive" icon={false}>
          2 errors
        </Badge>
        <Badge solid>12</Badge>
      </p>
    </div>
  ),
};

/** On the text baseline: in a sentence, a heading and a table cell. */
export const InContext: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-3">
      <p>
        The API is <Badge variant="success">operational</Badge> and search is <Badge variant="warning">degraded</Badge> since 09:12.
      </p>
      <h2 className="text-[20px] font-bold">
        Billing <Badge variant="info">beta</Badge>
      </h2>
      <table className="border-collapse text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5">
        <tbody>
          <tr>
            <td>INV-2041</td>
            <td>
              <Badge variant="warning">overdue</Badge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
