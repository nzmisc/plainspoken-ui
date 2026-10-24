"use client";

import { useState } from "react";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";

export default function CheckboxDemo() {
  const [items, setItems] = useState({ email: true, sms: false, push: true });
  const values = Object.values(items);
  const all = values.every(Boolean);
  const some = values.some(Boolean) && !all;
  return (
    <div className="flex flex-col">
      <Checkbox
        label="All notifications"
        checked={all}
        indeterminate={some}
        onChange={(e) => setItems({ email: e.target.checked, sms: e.target.checked, push: e.target.checked })}
      />
      <div className="flex flex-col pl-6">
        <Checkbox label="Email" checked={items.email} onChange={(e) => setItems({ ...items, email: e.target.checked })} />
        <Checkbox label="Text messages" description="Carrier rates may apply." checked={items.sms} onChange={(e) => setItems({ ...items, sms: e.target.checked })} />
        <Checkbox label="Push" checked={items.push} onChange={(e) => setItems({ ...items, push: e.target.checked })} />
      </div>
      <Checkbox label="Disabled" disabled />
    </div>
  );
}
