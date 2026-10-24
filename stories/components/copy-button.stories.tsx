import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";

const meta = {
  title: "Components/Controls/Copy button",
  component: CopyButton,
  args: { text: "npx shadcn@latest add button" },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const IconOnly: Story = {};
export const WithLabel: Story = { args: { label: "Copy command", size: "sm", variant: "default" } };

/** Ghost by default: in a table cell it adds no border of its own next to the cell's. */
export const InATable: Story = {
  render: () => (
    <table className="text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5">
      <tbody>
        {["100.101.7.12", "smb://atlas/ana", "https://example.com/r/registry.json"].map((v) => (
          <tr key={v}>
            <td className="font-mono text-[13px]">{v}</td>
            <td className="w-0 !px-0.5">
              <CopyButton text={v} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
