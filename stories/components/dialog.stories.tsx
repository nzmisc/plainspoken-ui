import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog, type DialogProps } from "@/registry/plainspoken/ui/dialog";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";

/**
 * Most stories open their dialog on load; close it and use the button to open it again. Those
 * are left off the docs page, since an open modal makes the rest of the page inert.
 *
 * Keyboard: focus starts on the first control in the body (or the one marked `data-autofocus`),
 * Tab stays inside the dialog, Escape closes it (the top one, when dialogs are stacked), and focus
 * goes back to the button that opened it.
 */
const meta = {
  title: "Components/Overlays/Dialog",
  component: Dialog,
  args: { open: false, onClose: () => {}, title: "" },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function useOpen(initial = true) {
  const [open, setOpen] = useState(initial);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

function Basic({ initial = true, ...props }: Partial<DialogProps> & { initial?: boolean }) {
  const d = useOpen(initial);
  return (
    <>
      <Button onClick={d.show}>Open dialog</Button>
      <Dialog
        open={d.open}
        onClose={d.hide}
        title="Publish to the web"
        description="Anyone with the link can read this document."
        footer={
          <>
            <Button onClick={d.hide}>Cancel</Button>
            <Button variant="primary" onClick={d.hide}>
              Publish
            </Button>
          </>
        }
        {...props}
      >
        <p>
          The document will be at <a href="#doc" className="text-link underline visited:text-link-visited">docs.northwind.example/p/q3-plan</a>.
          Changes you make later are published within a minute. You can stop publishing at any time from the Share menu.
        </p>
      </Dialog>
    </>
  );
}

/** Closed: click the button, or Tab to it and press Enter. */
export const Closed: Story = { render: () => <Basic initial={false} /> };

/** Title, a line of description, text, and two buttons. */
export const Default: Story = { tags: ["!autodocs"], render: () => <Basic /> };

function SizesStory() {
  const [size, setSize] = useState<DialogProps["size"] | null>(null);
  return (
    <div className="flex gap-2">
      {(["sm", "md", "lg", "full"] as const).map((s) => (
        <Button key={s} onClick={() => setSize(s)}>
          {s}
        </Button>
      ))}
      <Dialog
        open={size != null}
        onClose={() => setSize(null)}
        size={size ?? "md"}
        title={`size="${size}"`}
        footer={<Button onClick={() => setSize(null)}>Close</Button>}
      >
        <p>Press Escape or click outside to close.</p>
      </Dialog>
    </div>
  );
}
/** sm 24rem, md 36rem (the default), lg 56rem, full. On a phone every size but sm fills the screen. */
export const Sizes: Story = {
  render: () => <SizesStory />,
};

interface Draft {
  name: string;
  slug: string;
  region: string;
}
const EMPTY: Draft = { name: "", slug: "", region: "eu-north" };
function validate(v: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!v.name.trim()) e.name = "Enter a name.";
  if (!v.slug) e.slug = "Enter an address.";
  else if (!/^[a-z0-9-]+$/.test(v.slug)) e.slug = "Lowercase letters, digits and dashes only.";
  else if (["www", "app", "admin"].includes(v.slug)) e.slug = `“${v.slug}” is taken.`;
  return e;
}

function FormWithValidationStory() {
  const d = useOpen();
  const [v, setV] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const show = () => {
    setV(EMPTY);
    setTried(false);
    d.show();
  };
  const errors = validate(v);
  const shown = tried ? errors : {};
  const count = Object.keys(shown).length;
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTried(true);
    const bad = Object.keys(errors)[0];
    if (bad) return e.currentTarget.querySelector<HTMLElement>(`[name="${bad}"]`)?.focus();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      d.hide();
    }, 1200);
  };
  return (
    <>
      <Button onClick={show}>New workspace</Button>
      <Dialog
        open={d.open}
        onClose={d.hide}
        busy={busy}
        dismissOnBackdrop={JSON.stringify(v) === JSON.stringify(EMPTY)}
        title="New workspace"
        description="You can invite people once it exists."
        footer={
          <>
            <Button disabled={busy} onClick={d.hide}>
              Cancel
            </Button>
            <Button type="submit" form="new-workspace" variant="primary" loading={busy}>
              Create
            </Button>
          </>
        }
      >
        <form id="new-workspace" noValidate onSubmit={submit} className="flex flex-col gap-3">
          {count > 0 && (
            <p role="alert" className="border border-destructive px-2 py-1 text-destructive">
              {count === 1 ? "One field needs" : `${count} fields need`} fixing.
            </p>
          )}
          <Field label="Name" required error={shown.name}>
            <Input name="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Address" required error={shown.slug}>
              <Input name="slug" suffix=".northwind.app" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} />
            </Field>
            <Field label="Data region">
              <Select
                name="region"
                value={v.region}
                onChange={(e) => setV({ ...v, region: e.target.value })}
                options={[
                  { value: "eu-north", label: "Stockholm" },
                  { value: "eu-west", label: "Dublin" },
                  { value: "us-east", label: "Virginia" },
                ]}
              />
            </Field>
          </div>
        </form>
      </Dialog>
    </>
  );
}
/**
 * A form in a dialog. Errors show after the first try, next to their field and summed up at the
 * top; the first wrong field gets focus. Once anything is typed, the backdrop no longer closes
 * it. Saving makes it busy for a moment.
 */
export const FormWithValidation: Story = {
  tags: ["!autodocs"],
  render: () => <FormWithValidationStory />,
};

function LongContentStory() {
  const d = useOpen();
  const lines = Array.from({ length: 90 }, (_, i) => {
    const t = new Date(Date.UTC(2026, 9, 24, 7, 0, i * 7)).toISOString().slice(11, 19);
    return `${t}  POST /api/messages  201  ${(20 + ((i * 37) % 90)) / 10} ms`;
  });
  return (
    <>
      <Button onClick={d.show}>Open log</Button>
      <Dialog
        open={d.open}
        onClose={d.hide}
        size="lg"
        title="Request log"
        description="api.northwind.app · last 90 requests"
        footer={
          <>
            <span className="mr-auto text-muted-foreground">90 lines</span>
            <Button>Download</Button>
            <Button onClick={d.hide}>Close</Button>
          </>
        }
      >
        <pre className="font-mono text-[12px] leading-snug">{lines.join("\n")}</pre>
      </Dialog>
    </>
  );
}
/** A long body scrolls on its own; the title bar and footer stay put. */
export const LongContent: Story = {
  tags: ["!autodocs"],
  render: () => <LongContentStory />,
};

function NestedStory() {
  const outer = useOpen();
  const inner = useOpen(false);
  const [people, setPeople] = useState(["Priya Raman", "Tomás Ferreira", "Hannah Lindqvist"]);
  const [target, setTarget] = useState("");
  return (
    <>
      <Button onClick={outer.show}>Members</Button>
      <Dialog open={outer.open} onClose={outer.hide} title="Members of Design" footer={<Button onClick={outer.hide}>Done</Button>}>
        <ul className="flex flex-col">
          {people.map((p) => (
            <li key={p} className="flex items-center justify-between gap-2 border-b border-border py-1 last:border-b-0">
              {p}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setTarget(p);
                  inner.show();
                }}
              >
                Remove
              </Button>
            </li>
          ))}
          {people.length === 0 && <li className="text-muted-foreground">Nobody left.</li>}
        </ul>
      </Dialog>
      <AlertDialog
        open={inner.open}
        onClose={inner.hide}
        destructive
        title={`Remove ${target}?`}
        description="They lose access to the Design projects at once."
        confirmLabel="Remove"
        onConfirm={() => setPeople((ps) => ps.filter((x) => x !== target))}
      />
    </>
  );
}
/** A dialog that opens a confirmation on top of itself. Escape closes the top one first. */
export const Nested: Story = {
  tags: ["!autodocs"],
  render: () => <NestedStory />,
};

function BusyCannotCloseStory() {
  const d = useOpen();
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <>
      <Button onClick={d.show}>Open</Button>
      <Dialog
        open={d.open}
        onClose={d.hide}
        size="sm"
        busy={left > 0}
        title="Restore from backup"
        footer={
          <>
            <Button disabled={left > 0} onClick={d.hide}>
              Close
            </Button>
            <Button variant="primary" loading={left > 0} onClick={() => setLeft(5)}>
              Restore
            </Button>
          </>
        }
      >
        <p aria-live="polite">
          {left > 0 ? `Restoring… ${left} s. This dialog can't be closed until it's done.` : "Press Restore, then try Escape."}
        </p>
      </Dialog>
    </>
  );
}
/** While busy, Escape, the backdrop and the × do nothing; the dialog says why and for how long. */
export const BusyCannotClose: Story = {
  tags: ["!autodocs"],
  render: () => <BusyCannotCloseStory />,
};

function FullScreenStory() {
  const d = useOpen();
  return (
    <>
      <Button onClick={d.show}>Open</Button>
      <Dialog open={d.open} onClose={d.hide} size="full" title="Invoices" description="2026, all customers" bodyClassName="p-0" footer={<Button onClick={d.hide}>Close</Button>}>
        <table className="w-full border-collapse [&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:border-b [&_th]:border-border [&_th]:bg-background [&_th]:px-3 [&_th]:py-1 [&_th]:text-left">
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 40 }, (_, i) => (
              <tr key={i}>
                <td className="font-mono text-[13px]">INV-{2026_0400 + i}</td>
                <td>{["Lindqvist AB", "Ferreira & Filhos", "Raman Studio", "Okafor Ltd"][i % 4]}</td>
                <td className="text-right tabular-nums">€{((i * 137) % 900) + 100}.00</td>
                <td>{i % 5 === 0 ? "Overdue" : "Paid"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Dialog>
    </>
  );
}
/** The largest size: nearly the whole window on a desktop, all of it on a phone. `bodyClassName="p-0"` lets a table run edge to edge. */
export const FullScreen: Story = {
  tags: ["!autodocs"],
  render: () => <FullScreenStory />,
};

/** On a phone: full screen, the footer at the bottom. */
export const Phone: Story = {
  tags: ["!autodocs"],
  globals: { viewport: { value: "iphoneSE" } },
  render: () => <Basic />,
};
