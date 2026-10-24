import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";

const meta: Meta = { title: "Components/Forms/Radio group" };
export default meta;

const OPTIONS = [
  { value: "free", label: "Free", description: "One project, community support." },
  { value: "team", label: "Team", description: "Unlimited projects, $12 per seat." },
  { value: "enterprise", label: "Enterprise", description: "SSO and audit logs.", disabled: true },
] as const;

export const Boxed: StoryObj = {
  render: function Render() {
    const [v, setV] = useState<string | null>("team");
    return <RadioGroup legend="Plan" value={v} onChange={setV} options={[...OPTIONS]} className="max-w-sm" />;
  },
};

export const HorizontalBare: StoryObj = {
  render: function Render() {
    const [v, setV] = useState<string | null>("weekly");
    return (
      <RadioGroup
        bare
        horizontal
        legend="Digest"
        value={v}
        onChange={setV}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "never", label: "Never" },
        ]}
      />
    );
  },
};

export const WithError: StoryObj = {
  render: function Render() {
    const [v, setV] = useState<string | null>(null);
    return <RadioGroup legend="Plan" value={v} onChange={setV} options={[...OPTIONS]} error={v ? undefined : "Choose a plan."} className="max-w-sm" />;
  },
};
