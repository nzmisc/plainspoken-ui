import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatVersionFooter, type ChatVersionFooterProps } from "@/registry/plainspoken/blocks/chat/version-footer";
import { showcaseArtifact } from "@/registry/plainspoken/blocks/chat/showcase";

const versions = showcaseArtifact("doc-store").versions;

function Footer({ index: start = 0, ...rest }: Partial<ChatVersionFooterProps>) {
  const [index, setIndex] = useState(start);
  const [diff, setDiff] = useState(false);
  return (
    <ChatVersionFooter
      versions={versions}
      {...rest}
      index={index}
      onIndexChange={setIndex}
      diff={diff}
      onDiffChange={setDiff}
      onRestore={(i) => console.log("restore", i)}
      className="max-w-2xl border border-border"
    />
  );
}

const meta: Meta<typeof Footer> = {
  title: "Blocks/AI chat/Version footer",
  component: Footer,
};
export default meta;
type Story = StoryObj<typeof Footer>;

/** An older version: the arrows, Restore and Latest. */
export const Older: Story = {};

/** The latest version: only the arrows and Changes, which shows what it changed from the one before. */
export const Latest: Story = { args: { index: versions.length - 1 } };

/** While the model is writing, Restore waits. */
export const Busy: Story = { args: { busy: true } };
