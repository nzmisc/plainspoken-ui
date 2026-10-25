"use client";

import { BookOpen, CreditCard, LogOut, User, Users } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { ME, type TeamMember } from "@/registry/plainspoken/blocks/app/data";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AppUserMenuProps {
  user?: TeamMember;
  /** Where Profile, Team and Billing go */
  settingsHref?: string;
  defaultOpen?: boolean;
}

/**
 * The account menu behind the avatar at the end of the top bar: who is signed in, links to the
 * profile, team and billing settings and the docs, and Sign out. The avatar button is named for
 * screen readers ("Account: Mateo Alvarez").
 */
export function AppUserMenu({ user = ME, settingsHref = "/demos/app/settings", defaultOpen }: AppUserMenuProps) {
  return (
    <DropdownMenu
      align="end"
      defaultOpen={defaultOpen}
      className="min-w-56"
      items={[
        { type: "label", label: `${user.name} · ${user.email}` },
        { label: "Profile", icon: User, href: settingsHref },
        { label: "Team", icon: Users, href: settingsHref, hint: "6 people" },
        { label: "Billing", icon: CreditCard, href: settingsHref, hint: "Studio plan" },
        { type: "separator" },
        { label: "Documentation", icon: BookOpen, href: "/docs" },
        { label: "Sign out", icon: LogOut },
      ]}
      trigger={(props) => (
        <button {...props} aria-label={`Account: ${user.name}`} className={cn("flex shrink-0 cursor-pointer", FOCUS_RING)}>
          <Avatar name={user.name} size={28} />
        </button>
      )}
    />
  );
}
