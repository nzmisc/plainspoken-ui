import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MailApp } from "@/registry/plainspoken/blocks/mail/mail-app";

const meta: Meta<typeof MailApp> = {
  title: "Demos/Mail",
  component: MailApp,
  parameters: { layout: "fullscreen" },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof MailApp>;

/** The demo as it is at /demos/mail: Postbox, Nora Lindqvist's mail at a small design studio, with the catalogue proofs open. */
export const Inbox: Story = { args: { defaultOpenId: "catalogue" } };

/** Several conversations ticked, with the bulk actions. */
export const Selecting: Story = { args: { defaultOpenId: "lumen", selected: ["harbour-invoice", "mum-lunch", "vat", "tea"] } };

/** Writing a new message. */
export const Composing: Story = { args: { defaultOpenId: "catalogue", defaultComposing: true } };

/** On a phone: the list. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };

/** On a phone, reading a conversation. */
export const PhoneReading: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { defaultOpenId: "lumen", defaultPane: "message" } };
