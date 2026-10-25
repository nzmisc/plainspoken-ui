import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { AlertDialog, type AlertDialogProps } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";

/**
 * Most stories open on load; close and reopen with the button. Those are left off the docs page,
 * since an open modal makes the rest of the page inert.
 *
 * Keyboard: focus starts on Cancel (on the text box with `typeToConfirm`), Tab moves between the
 * two buttons, Escape cancels. A click on the backdrop does nothing.
 */
const meta = {
  title: "Components/Overlays/Alert dialog",
  component: AlertDialog,
  args: { open: false, onClose: () => {}, title: "", description: "", confirmLabel: "", onConfirm: () => {} },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial = true, button = "Open", ...props }: Omit<AlertDialogProps, "open" | "onClose"> & { initial?: boolean; button?: string }) {
  const [open, setOpen] = useState(initial);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{button}</Button>
      <AlertDialog open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

const leave = {
  title: "Leave without saving?",
  description: "Your changes to “Q3 plan” will be lost.",
  confirmLabel: "Leave",
  cancelLabel: "Stay",
  onConfirm: () => {},
};

/** Closed: the button opens it. */
export const Closed: Story = { render: () => <Demo initial={false} button="Close document" {...leave} /> };

/** A plain confirmation, with the confirm button in the primary style. */
export const Default: Story = { tags: ["!autodocs"], render: () => <Demo {...leave} /> };

/** Destructive: the confirm button is red; focus is still on Cancel. */
export const Destructive: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Demo
      destructive
      title="Delete 12 messages?"
      description="They go to Trash and are deleted for good after 30 days."
      confirmLabel="Delete"
      onConfirm={() => {}}
    />
  ),
};

/** For the really destructive ones: the button stays disabled until the name is typed. The confirm takes a moment. */
export const TypeToConfirm: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Demo
      destructive
      title="Delete storefront-2026?"
      description="Its files, deployments and environment variables are deleted at once. This can't be undone."
      confirmLabel="Delete project"
      typeToConfirm="storefront-2026"
      onConfirm={() => new Promise((r) => setTimeout(r, 1200))}
    />
  ),
};

/** An async confirm that fails: the dialog stays open and shows the error. */
export const ConfirmFails: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Demo
      title="Restart the build server?"
      description="Builds in progress are cancelled and start again afterwards."
      confirmLabel="Restart"
      onConfirm={() => new Promise((_, no) => setTimeout(() => no(new Error("build-03 didn't answer within 30 s. Nothing was restarted.")), 900))}
    />
  ),
};

/** Extra detail as children: what else goes with it. */
export const WithDetails: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Demo
      destructive
      title="Remove Tomás Ferreira?"
      description="He loses access to the workspace at once."
      confirmLabel="Remove"
      onConfirm={() => {}}
    >
      <p>These stay, and move to you:</p>
      <ul className="list-disc pl-5">
        <li>4 projects he owns</li>
        <li>17 open issues assigned to him</li>
      </ul>
    </Demo>
  ),
};
