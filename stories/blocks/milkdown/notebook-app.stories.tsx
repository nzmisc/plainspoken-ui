import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotebookApp } from "@/registry/plainspoken/blocks/milkdown/notebook-app";

const meta: Meta<typeof NotebookApp> = {
  title: "Blocks/Editor (Milkdown)/Notebook app",
  component: NotebookApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "720px" } } },
  args: { className: "h-dvh", hashRouting: false },
};
export default meta;
type Story = StoryObj<typeof NotebookApp>;

/** RFC-0042: footnotes, code, a table and a rollout checklist. */
export const Rfc: Story = {};

/** A runbook in a folder of the Operations part: bash, SQL and a checklist. */
export const Runbook: Story = { args: { defaultPageId: "validator-latency" } };

/** The incident review in Preview: a picture, a timeline table and a quote. */
export const IncidentPreview: Story = { args: { defaultPageId: "route-7-taps", defaultMode: "preview" } };

/** No pages at all: what is left after deleting every page. */
export const Empty: Story = { args: { pages: [] } };

/** On a phone: the sidebar is a drawer behind the menu button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
