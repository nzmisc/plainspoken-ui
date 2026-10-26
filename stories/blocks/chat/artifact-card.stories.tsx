import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ChatPart } from "@/registry/plainspoken/blocks/chat/data";
import { ChatArtifactCard } from "@/registry/plainspoken/blocks/chat/artifact-card";
import { showcaseArtifact, showcaseToolPart } from "@/registry/plainspoken/blocks/chat/showcase";

const store = showcaseArtifact("doc-store");

const meta: Meta<typeof ChatArtifactCard> = {
  title: "Blocks/AI chat/Artifact card",
  component: ChatArtifactCard,
  args: { part: showcaseToolPart("call-store-1"), artifact: store, onOpen: (t) => console.log("open", t) },
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatArtifactCard>;

/** A document the model made: its kind, title, size, the start of it, and Open. */
export const Created: Story = {};

/** Open beside the chat right now. */
export const Active: Story = { args: { active: true } };

/** Code: the language and how many lines. */
export const Code: Story = { args: { part: showcaseToolPart("call-window-1"), artifact: showcaseArtifact("doc-window") } };

/** A sheet: rows and columns, and the first few rows. */
export const Sheet: Story = { args: { part: showcaseToolPart("call-budget-1"), artifact: showcaseArtifact("doc-budget") } };

const writing: ChatPart = {
  type: "tool-createDocument",
  toolCallId: "w1",
  state: "input-streaming",
  input: { kind: "text", title: "Notes for the boathouse meeting", content: "# Notes for the boathouse meeting\n\n## What we agreed\n\n- The roof is fixed" },
};

/** Still being written: Watch opens the panel as it fills in. */
export const Writing: Story = { args: { part: writing, artifact: undefined } };

/** A change to a document: one line, with Open at that version. */
export const Updated: Story = { args: { part: showcaseToolPart("call-store-2") } };

/** Suggestions: how many the model left. */
export const Suggestions: Story = { args: { part: showcaseToolPart("call-store-3") } };

/** A change that failed, with the reason and what was asked. */
export const Failed: Story = {
  args: {
    part: { type: "tool-editDocument", toolCallId: "f1", state: "output-error", input: { id: "doc-store", find: "Plan your paddle", replace: "Plan every paddle" }, errorText: "That passage isn't in the document." },
  },
};
