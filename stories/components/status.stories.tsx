import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorLine, Status, type StatusVariant } from "@/registry/plainspoken/ui/status";

const meta = {
  title: "Components/Feedback/Status",
  component: Status,
  args: { variant: "success", children: "operational" },
  argTypes: { variant: { control: "select", options: ["default", "info", "success", "warning", "destructive"] }, icon: { control: false } },
} satisfies Meta<typeof Status>;
export default meta;
type Story = StoryObj<typeof meta>;

const WORDS: Record<StatusVariant, string> = {
  default: "unknown",
  info: "maintenance",
  success: "running",
  warning: "filling up",
  destructive: "unreachable",
};

export const Playground: Story = {};

/** Always a symbol and words, never colour alone. */
export const Variants: Story = {
  render: () => (
    <ul className="flex flex-col gap-1">
      {(Object.keys(WORDS) as StatusVariant[]).map((v) => (
        <li key={v}>
          <code className="mr-2 font-mono text-[13px]">{v}</code>
          <Status variant={v}>{WORDS[v]}</Status>
        </li>
      ))}
    </ul>
  ),
};

/** In table cells, where a badge would be loud. */
export const InTable: Story = {
  render: () => (
    <table className="border-collapse text-[14px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-0.5 [&_th]:text-left">
      <thead>
        <tr>
          <th>Service</th>
          <th>Access</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Web front end</td>
          <td>
            <Status variant="success">private network</Status>
          </td>
        </tr>
        <tr>
          <td>Dashboard</td>
          <td>
            <Status variant="destructive">public</Status>
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

/** One line for a failed fetch; long messages wrap anywhere. */
export const ErrorLines: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <ErrorLine>Usage check failed 2 min ago: HTTP 401 unauthorized</ErrorLine>
      <ErrorLine label="Timeout:">https://api.example.com/v1/organizations/acme-corporation/usage/current-period-with-a-long-path</ErrorLine>
    </div>
  ),
};
