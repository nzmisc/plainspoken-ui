"use client";

import { useState } from "react";
import { ChevronDown, CreditCard, LogOut, Moon, Settings, User } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Your own trigger: pass a function and spread the props it gets onto a <button>. Here an avatar
 * and name open the account menu, with links, a theme choice and signing out.
 */
export default function DropdownMenuUser() {
  const [theme, setTheme] = useState("system");
  return (
    <div className="flex justify-end border border-border bg-muted px-2 py-1">
      <DropdownMenu
        align="end"
        trigger={(props) => (
          <button {...props} className={cn("flex cursor-pointer items-center gap-2 px-1 py-0.5 hover:bg-accent", FOCUS_RING)}>
            <Avatar name="Mira Okafor" size={24} />
            <span className="max-sm:sr-only">Mira Okafor</span>
            <Icon icon={ChevronDown} className="text-muted-foreground" />
          </button>
        )}
        items={[
          { type: "label", label: "mira@northwind.example" },
          { label: "Profile", icon: User, href: "#profile" },
          { label: "Billing", icon: CreditCard, href: "#billing" },
          { label: "Settings", icon: Settings, href: "#settings", shortcut: "⌘," },
          { type: "separator" },
          {
            type: "submenu",
            label: "Theme",
            icon: Moon,
            items: [
              {
                type: "radio",
                value: theme,
                onValueChange: setTheme,
                options: [
                  { value: "system", label: "Same as the system" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ],
              },
            ],
          },
          { type: "separator" },
          { label: "Sign out", icon: LogOut },
        ]}
      />
    </div>
  );
}
