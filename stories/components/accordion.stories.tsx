import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion, AccordionItem } from "@/registry/plainspoken/ui/accordion";

const ITEMS = [
  { id: "rdp", title: "Remote desktop", meta: ":3389", content: <p>xrdp in front of a shared desktop session, reachable on the private network only.</p> },
  { id: "smb", title: "File shares", meta: "2 shares", content: <p>smb://files/team and smb://files/archive, SMB3 only.</p> },
  { id: "code", title: "Code server", meta: ":443", content: <p>The web editor, behind single sign-on.</p> },
];

const meta = {
  title: "Components/Layout/Accordion",
  component: Accordion,
  args: { items: ITEMS, exclusive: false, defaultOpen: ["rdp"] },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Plain <details>: Tab to a header, Enter or Space opens and closes it. Find-in-page (Ctrl+F)
 * opens a closed section that holds a match.
 */
export const Playground: Story = {};

/** Opening one closes the others (native `<details name>`). */
export const Exclusive: Story = { args: { exclusive: true, defaultOpen: ["smb"] } };

/** Written as children instead of data; exclusive works the same way. */
export const Children: Story = {
  render: () => (
    <Accordion exclusive>
      <AccordionItem title="What does it cost?" defaultOpen>
        <p>€4 per seat per month, billed yearly.</p>
      </AccordionItem>
      <AccordionItem title="Can I cancel at any time?" meta="Billing">
        <p>Yes. You keep access until the end of the period you paid for.</p>
      </AccordionItem>
    </Accordion>
  ),
};

/** A single AccordionItem is a disclosure on its own. */
export const Single: Story = {
  render: () => (
    <AccordionItem title="Advanced settings" className="border border-border">
      <p>Proxy, timeouts and retry policy.</p>
    </AccordionItem>
  ),
};

/** Long titles wrap; meta stays on the right. */
export const LongText: Story = {
  args: {
    items: [
      {
        id: "long",
        title: "What happens to the files in a shared folder when the person who shared it leaves the workspace?",
        meta: "Sharing",
        content: <p>Ownership moves to the workspace owner, and everyone who had access keeps it.</p>,
      },
    ],
    defaultOpen: [],
  },
};
