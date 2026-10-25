import { MailApp } from "@/registry/plainspoken/blocks/mail/mail-app";

/**
 * The whole client in a 640px box: drag the line between list and message, collapse the sidebar
 * to a rail, open folders and conversations, and press Compose. Narrow the window to see it turn
 * into one pane at a time.
 */
export default function MailAppDemo() {
  return <MailApp defaultOpenId="lumen" className="h-[640px] border border-border" />;
}
