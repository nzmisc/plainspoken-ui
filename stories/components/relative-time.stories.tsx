import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";

const meta = {
  title: "Components/Data display/Relative time",
  component: RelativeTime,
  args: { date: "2026-10-24T16:40:00Z", format: "short" },
  argTypes: { format: { control: "inline-radio", options: ["short", "long"] } },
} satisfies Meta<typeof RelativeTime>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Live: these were made when the story opened and tick every second. Hover for the full local date. */
export const Live: Story = {
  render: function Render() {
    const [start] = useState(() => Date.now());
    const times = [4_000, 12 * 60_000, 3 * 3600_000 + 20 * 60_000, 5 * 86400_000, 400 * 86400_000];
    return (
      <table className="text-[14px]">
        <tbody>
          {times.map((ms) => (
            <tr key={ms}>
              <td className="pr-6 text-right">
                <RelativeTime date={start - ms} />
              </td>
              <td className="text-muted-foreground">
                <RelativeTime date={start - ms} format="long" />
              </td>
            </tr>
          ))}
          <tr>
            <td className="pr-6 text-right">
              <RelativeTime date={start + 90 * 60_000} />
            </td>
            <td className="text-muted-foreground">
              <RelativeTime date={start + 90 * 60_000} format="long" />
            </td>
          </tr>
        </tbody>
      </table>
    );
  },
};

/** A fixed `now`: renders at once (on the server too) and never ticks. */
export const FixedNow: Story = { args: { now: "2026-10-25T12:00:00Z", format: "long", locale: "en" } };

/** In other languages (long format and the hover text). */
export const Languages: Story = {
  render: () => (
    <ul>
      {["en", "de", "fr", "ja"].map((l) => (
        <li key={l}>
          <code className="mr-2 font-mono text-[13px]">{l}</code>
          <RelativeTime date="2026-10-24T09:00:00Z" now="2026-10-25T12:00:00Z" format="long" locale={l} />
        </li>
      ))}
    </ul>
  ),
};
