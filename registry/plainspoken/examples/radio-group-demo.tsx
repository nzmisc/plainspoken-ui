"use client";

import { useState } from "react";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";

export default function RadioGroupDemo() {
  const [plan, setPlan] = useState<"free" | "team" | "enterprise">("team");
  return (
    <div className="max-w-sm">
      <RadioGroup
        legend="Plan"
        value={plan}
        onChange={setPlan}
        options={[
          { value: "free", label: "Free", description: "One project, community support." },
          { value: "team", label: "Team", description: "Unlimited projects, $12 per seat." },
          { value: "enterprise", label: "Enterprise", description: "SSO and audit logs.", disabled: true },
        ]}
      />
    </div>
  );
}
