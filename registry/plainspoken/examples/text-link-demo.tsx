import { TextLink } from "@/registry/plainspoken/ui/text-link";

export default function TextLinkDemo() {
  return (
    <div className="flex max-w-prose flex-col gap-3">
      <p>
        Read the <TextLink href="#guide">installation guide</TextLink> first, then the notes on{" "}
        <TextLink href="">theming</TextLink> (a link you have visited is purple). The registry follows the{" "}
        <TextLink href="https://ui.shadcn.com/docs/registry" external>
          shadcn registry format
        </TextLink>
        .
      </p>
      <p className="text-[13px] text-muted-foreground">
        © 2026 Example GmbH · <TextLink variant="muted" href="#privacy">Privacy</TextLink> ·{" "}
        <TextLink variant="muted" href="#terms">
          Terms
        </TextLink>
      </p>
    </div>
  );
}
