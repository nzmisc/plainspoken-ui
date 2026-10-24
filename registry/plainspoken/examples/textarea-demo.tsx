"use client";

import { useState } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

export default function TextareaDemo() {
  const [text, setText] = useState("Shipped the new registry today.");
  return (
    <div className="max-w-md">
      <Field label="Status update">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={140} showCount />
      </Field>
    </div>
  );
}
