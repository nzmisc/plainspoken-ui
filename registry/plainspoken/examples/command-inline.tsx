"use client";

import { useState } from "react";
import { Bell, CreditCard, Globe, Key, Lock, Mail, Palette, Shield, User, Users } from "@/registry/plainspoken/lib/icons";
import { Command } from "@/registry/plainspoken/ui/command";

/** In the page instead of a dialog: a "jump to a setting" box at the top of a settings sidebar, at the small size. */
export default function CommandInline() {
  const [page, setPage] = useState("Profile");
  const go = (p: string) => () => setPage(p);
  return (
    <div className="flex max-w-2xl flex-wrap gap-4">
      <Command
        size="sm"
        label="Settings"
        placeholder="Find a setting…"
        className="w-72"
        listClassName="max-h-64"
        groups={[
          {
            heading: "Account",
            items: [
              { label: "Profile", icon: User, keywords: ["name", "photo", "avatar"], onSelect: go("Profile") },
              { label: "Email addresses", icon: Mail, onSelect: go("Email addresses") },
              { label: "Password", icon: Key, onSelect: go("Password") },
              { label: "Two-factor authentication", icon: Shield, keywords: ["2fa", "security", "otp"], onSelect: go("Two-factor authentication") },
            ],
          },
          {
            heading: "Workspace",
            items: [
              { label: "Members", icon: Users, keywords: ["invite", "people"], onSelect: go("Members") },
              { label: "Billing", icon: CreditCard, keywords: ["plan", "invoice", "payment"], onSelect: go("Billing") },
              { label: "Domains", icon: Globe, onSelect: go("Domains") },
              { label: "Single sign-on", icon: Lock, hint: "Enterprise", disabled: true, onSelect: go("Single sign-on") },
            ],
          },
          {
            heading: "App",
            items: [
              { label: "Notifications", icon: Bell, keywords: ["email", "push", "alerts"], onSelect: go("Notifications") },
              { label: "Appearance", icon: Palette, keywords: ["theme", "dark", "density"], onSelect: go("Appearance") },
            ],
          },
        ]}
      />
      <section className="min-w-48 flex-1 border border-border p-3">
        <h3 className="font-bold">{page}</h3>
        <p className="text-muted-foreground">Type “2fa”, “invoice” or “dark” in the box: keywords find settings by other names.</p>
      </section>
    </div>
  );
}
