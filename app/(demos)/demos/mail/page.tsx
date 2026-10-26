import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { MailApp } from "@/registry/plainspoken/blocks/mail/mail-app";

export const metadata: Metadata = {
  title: "Mail",
  description:
    "A three-pane email client built from plainspoken-ui: folders and labels, a message list with search and filters, a reading pane with threads, and a compose dialog.",
};

export default function MailPage() {
  return <MailApp defaultOpenId="catalogue" actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
