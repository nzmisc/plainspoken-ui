import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { ChatArtifact } from "@/registry/plainspoken/blocks/chat/data";
import { ChatArtifactPanel, type ChatArtifactPanelProps } from "@/registry/plainspoken/blocks/chat/artifact-panel";
import { showcaseArtifact } from "@/registry/plainspoken/blocks/chat/showcase";

/** The panel with its document and version kept in state, as the app keeps them */
function Panel({ artifact, index: start, ...rest }: Partial<ChatArtifactPanelProps>) {
  const [doc, setDoc] = useState<ChatArtifact | null>(artifact ?? null);
  const [index, setIndex] = useState(start);
  return (
    <ChatArtifactPanel
      {...rest}
      artifact={doc}
      onChange={setDoc}
      index={index}
      onIndexChange={setIndex}
      onAsk={(prompt) => console.log("ask", prompt)}
      onClose={() => console.log("close")}
      className="h-[640px] border border-border"
    />
  );
}

const meta: Meta<typeof Panel> = {
  title: "Blocks/AI chat/Artifact panel",
  component: Panel,
  parameters: { layout: "fullscreen" },
  args: { artifact: showcaseArtifact("doc-store") },
  decorators: [(S) => <div className="max-w-3xl p-4">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof Panel>;

/**
 * A text document, as Markdown: three suggestions from the model to accept or reject, the version
 * footer (‹ ›, Changes, Restore), Edit, Copy, Download and quick actions that ask the model.
 */
export const Text: Story = {};

/** An older version: Restore adds it again as the newest; Changes shows what it changed. */
export const OlderVersion: Story = { args: { index: 0 } };

/**
 * Code, highlighted, with Run: JavaScript and TypeScript run in a sandboxed frame with no network,
 * and the console shows what they printed. This one was run once already.
 */
export const Code: Story = { args: { artifact: showcaseArtifact("doc-window") } };

/** A sheet: a table to edit cell by cell; numbers line up right, and Download gives a CSV. */
export const Sheet: Story = { args: { artifact: showcaseArtifact("doc-budget") } };

/** Being written: the document fills in as the model's tool call streams, with no actions until it is done. */
export const Writing: Story = {
  args: {
    artifact: null,
    busy: true,
    draft: {
      callId: "c1",
      tool: "createDocument",
      kind: "text",
      title: "Notes for the boathouse meeting",
      content: "# Notes for the boathouse meeting\n\n## What we agreed\n\n- The roof is fixed **before** the spring regatta\n- Kit is checked in and",
    },
  },
};

/** While an answer streams, the actions that ask the model wait for it. */
export const Busy: Story = { args: { busy: true } };
