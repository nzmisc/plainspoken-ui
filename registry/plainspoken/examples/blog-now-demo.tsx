import { BlogNow } from "@/registry/plainspoken/blocks/blog/now";

export default function BlogNowDemo() {
  return (
    <BlogNow
      className="max-w-xs"
      updated="2026-10-14"
      items={[
        "Moving the last cron jobs at work to systemd timers.",
        "Reading The Design of Everyday Things again, with a pencil.",
        "Training for a half marathon in March. Slowly.",
      ]}
    />
  );
}
