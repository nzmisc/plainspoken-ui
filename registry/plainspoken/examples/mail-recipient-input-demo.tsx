"use client";

import { useState } from "react";
import { CONTACTS, type Person } from "@/registry/plainspoken/blocks/mail/data";
import { RecipientInput } from "@/registry/plainspoken/blocks/mail/recipient-input";

/** Type "ma" for suggestions; Enter or a comma makes a chip, Backspace takes the last one off. The red chip isn't an address. */
export default function MailRecipientInputDemo() {
  const [to, setTo] = useState<Person[]>([CONTACTS[2], CONTACTS[0], { name: "tomas@fernhill", email: "tomas@fernhill" }]);
  return (
    <div className="flex max-w-md flex-col gap-1">
      <label htmlFor="recipient-demo" className="text-[14px] font-medium">
        To
      </label>
      <RecipientInput id="recipient-demo" label="To" value={to} onChange={setTo} contacts={CONTACTS} placeholder="Name or address" />
    </div>
  );
}
