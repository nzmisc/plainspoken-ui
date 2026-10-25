"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";

export default function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Mira Okafor");
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <span className="text-muted-foreground">Signed in as {name}</span>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        description="Your name and address as other people in the workspace see them."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="edit-profile" variant="primary">
              Save
            </Button>
          </>
        }
      >
        <form
          id="edit-profile"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setName(String(new FormData(e.currentTarget).get("name")));
            setOpen(false);
          }}
        >
          <Field label="Name">
            <Input name="name" defaultValue={name} autoComplete="name" />
          </Field>
          <Field label="Email" hint="Changing it sends a confirmation to the new address.">
            <Input name="email" type="email" defaultValue="mira@northwind.example" autoComplete="email" />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
