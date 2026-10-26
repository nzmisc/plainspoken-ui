import type { Metadata } from "next";
import { AppBilling } from "@/registry/plainspoken/blocks/app/billing";
import { AppNotificationSettings } from "@/registry/plainspoken/blocks/app/notification-settings";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { AppProfileForm } from "@/registry/plainspoken/blocks/app/profile-form";
import { AppTeamTable } from "@/registry/plainspoken/blocks/app/team-table";
import { AppWorkspaceSettings } from "@/registry/plainspoken/blocks/app/workspace-settings";
import { Tabs } from "@/registry/plainspoken/ui/tabs";

export const metadata: Metadata = {
  title: "Settings · App skeleton",
  description: "The settings of Tally, a demo invoicing app built from plainspoken-ui: profile form, notification switches, team table, billing plans and a danger zone.",
};

export default function SettingsPage() {
  return (
    <AppPage>
      <AppPageHeader crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Settings" }]} title="Settings" description="Your profile, and how the workspace is set up." />
      <Tabs
        label="Settings"
        panelClassName="p-4"
        tabs={[
          { id: "profile", label: "Profile", content: <AppProfileForm /> },
          { id: "notifications", label: "Notifications", content: <AppNotificationSettings /> },
          { id: "team", label: "Team", count: 6, content: <AppTeamTable /> },
          { id: "billing", label: "Billing", content: <AppBilling /> },
          { id: "workspace", label: "Workspace", content: <AppWorkspaceSettings /> },
        ]}
      />
    </AppPage>
  );
}
