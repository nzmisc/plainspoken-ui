"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Download, Funnel, Plus, Printer, RefreshCw, Search, Trash } from "@/registry/plainspoken/lib/icons";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button, ButtonGroup, IconButton } from "@/registry/plainspoken/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { Status, type StatusVariant } from "@/registry/plainspoken/ui/status";
import { Switch } from "@/registry/plainspoken/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { Tabs } from "@/registry/plainspoken/ui/tabs";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

/** FOCUS_RING without the focus-visible: a control drawn as if focused, so the ring can be judged at a glance */
const SHOWN_FOCUSED = "outline-2 outline-offset-1 outline-ring";

const INVOICES = [
  { no: "INV-1042", customer: "Harbour Street Bakery", status: "Paid", due: "3 Oct", amount: "1,240.00", visited: true },
  { no: "INV-1043", customer: "Okafor & Lund", status: "Overdue", due: "12 Oct", amount: "380.50", visited: false },
  { no: "INV-1044", customer: "Pinecrest Veterinary", status: "Sent", due: "28 Oct", amount: "2,915.00", visited: true },
  { no: "INV-1045", customer: "Ngata Joinery", status: "Draft", due: "4 Nov", amount: "96.00", visited: false },
  { no: "INV-1046", customer: "Tidewater Books", status: "Sent", due: "9 Nov", amount: "12,050.75", visited: false },
];

const STATUS: Record<string, StatusVariant> = { Paid: "success", Overdue: "destructive", Sent: "info", Draft: "default" };

// The preview's links go nowhere: they are there for their colours
const stay = (e: MouseEvent) => e.preventDefault();

/**
 * A link in running text. `visited` draws it in the visited colour whatever the browser's history
 * says, since a fresh preview would otherwise have no visited links to show.
 */
function TextLink({ children, visited, href }: { children: ReactNode; visited?: boolean; href: string }) {
  return (
    <a
      href={href}
      onClick={stay}
      className={cn("underline underline-offset-2 hover:decoration-2", visited ? "text-link-visited" : "text-link visited:text-link-visited")}
    >
      {children}
    </a>
  );
}

/**
 * What the customizer shows a theme on: real components, dense ones included (a toolbar, a table
 * with links, a form), every button variant, one control drawn as if focused, and the status
 * colours in alerts and badges.
 */
export function ThemePreview() {
  const [range, setRange] = useState("30d");
  const [overdue, setOverdue] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [terms, setTerms] = useState("14");
  const [sendBy, setSendBy] = useState("email");
  const [selected, setSelected] = useState<string[]>(["INV-1043"]);
  const [dialog, setDialog] = useState(false);
  const rows = overdue ? INVOICES.filter((i) => i.status === "Overdue") : INVOICES;
  const toggle = (no: string) => setSelected((s) => (s.includes(no) ? s.filter((x) => x !== no) : [...s, no]));
  return (
    <div className="flex flex-col gap-4 p-3 text-[14px] sm:p-4">
      <div>
        <h3 className="text-[20px] leading-tight font-bold">Invoices</h3>
        <p className="mt-1 max-w-[64ch] text-muted-foreground">
          Five invoices this month, one overdue. Payment details are on the <TextLink href="#preview-settings">billing page</TextLink>; last
          month&apos;s are in the <TextLink href="#preview-archive" visited>archive</TextLink>.
        </p>
      </div>

      <Panel as="h4" title="This month" meta="5 invoices" flush>
        <div className="ctl-sm flex flex-wrap items-center gap-1.5 border-b border-border px-2 py-1.5">
          <Input prefix={Search} placeholder="Customer or number" aria-label="Search invoices" className="w-44" />
          <Chip pressed={overdue} onPressedChange={setOverdue}>
            Overdue only
          </Chip>
          <IconButton variant="ghost" icon={Funnel} label="More filters" />
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <SegmentedControl label="Period" value={range} onChange={setRange} options={["7d", "30d", "1y"]} />
            <IconButton variant="ghost" icon={RefreshCw} label="Refresh" />
            <IconButton variant="ghost" icon={Download} label="Export as CSV" />
            <Button variant="primary" icon={Plus}>
              New invoice
            </Button>
          </span>
        </div>
        <Table density="compact" rules="rows" frameless>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <span className="sr-only">Select</span>
              </TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="whitespace-nowrap">Amount (NZD)</TableHead>
              <TableHead className="w-px">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.no} data-state={selected.includes(r.no) ? "selected" : undefined}>
                <TableCell className="align-middle">
                  <Checkbox size="xs" label={<span className="sr-only">Select {r.no}</span>} checked={selected.includes(r.no)} onChange={() => toggle(r.no)} />
                </TableCell>
                <TableCell className="align-middle font-mono text-[12px] whitespace-nowrap">{r.no}</TableCell>
                <TableCell className="align-middle whitespace-nowrap">
                  <TextLink href={`#preview-${r.no}`} visited={r.visited}>
                    {r.customer}
                  </TextLink>
                </TableCell>
                <TableCell className="align-middle">
                  <Status variant={STATUS[r.status]}>{r.status}</Status>
                </TableCell>
                <TableCell className="align-middle whitespace-nowrap">{r.due}</TableCell>
                <TableCell numeric className="align-middle">
                  {r.amount}
                </TableCell>
                <TableCell className="ctl-xs py-0 align-middle whitespace-nowrap">
                  <IconButton variant="ghost" icon={Printer} label={`Print ${r.no}`} />
                  <IconButton variant="ghost" icon={Trash} label={`Delete ${r.no}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="border-t border-border px-2 py-1 text-[12px] text-muted-foreground">
          {selected.length} selected · Customer links: visited ones in the visited colour
        </p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel as="h4" title="Edit customer">
          <form className="flex flex-col gap-3 p-1" onSubmit={(e) => e.preventDefault()}>
            <Field label="Name" hint="Drawn as if focused, to show the focus ring.">
              <Input defaultValue="Okafor & Lund" className={SHOWN_FOCUSED} />
            </Field>
            <Field label="Billing email" error="This address bounced on 12 Oct." required>
              <Input type="email" defaultValue="accounts@okafor-lund.example" />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Field label="Payment terms">
                <Select
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  options={[
                    { value: "7", label: "7 days" },
                    { value: "14", label: "14 days" },
                    { value: "30", label: "30 days" },
                  ]}
                />
              </Field>
              <Field label="Credit limit" className="w-36">
                <Input defaultValue="5,000" prefix="$" inputClassName="text-right tabular-nums" />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea rows={2} defaultValue="Prefers invoices on the 1st. Ask for Mere in accounts." />
            </Field>
            <RadioGroup
              legend="Send invoices by"
              horizontal
              value={sendBy}
              onChange={setSendBy}
              options={[
                { value: "email", label: "Email" },
                { value: "post", label: "Post" },
                { value: "portal", label: "Customer portal", disabled: true },
              ]}
            />
            <Switch checked={reminders} onChange={setReminders} label="Send payment reminders" description="Three days before and after the due date." />
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Button variant="primary" type="submit">
                Save
              </Button>
              <Button>Cancel</Button>
              <Button variant="destructive" className="ml-auto" onClick={() => setDialog(true)}>
                Delete customer
              </Button>
            </div>
          </form>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel as="h4" title="Buttons">
            <div className="flex flex-col gap-2 p-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="primary">Primary</Button>
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
                <Button className={SHOWN_FOCUSED}>Focused</Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ButtonGroup label="Text alignment" size="sm">
                  <Button>Left</Button>
                  <Button>Centre</Button>
                  <Button>Right</Button>
                </ButtonGroup>
                <Button size="sm" loading>
                  Saving
                </Button>
                <Button size="xs" variant="outline">
                  Extra small
                </Button>
              </div>
            </div>
          </Panel>

          <Panel as="h4" title="Text">
            <div className="flex flex-col gap-2 p-1">
              <p className="leading-relaxed">
                Body text with a <TextLink href="#preview-link">link</TextLink>, a <TextLink href="#preview-visited" visited>visited link</TextLink>,{" "}
                <strong>bold</strong>, <code className="border border-border bg-muted px-1 font-mono text-[13px]">inline code</code> and{" "}
                <Kbd keys={["Ctrl", "K"]} />.
              </p>
              <p className="text-[13px] text-muted-foreground">Muted text: hints, captions, when something was last changed.</p>
              <p className="flex flex-wrap items-center gap-1.5">
                <Badge>Draft</Badge>
                <Badge variant="info">Sent</Badge>
                <Badge variant="success">Paid</Badge>
                <Badge variant="warning">Due soon</Badge>
                <Badge variant="destructive">Overdue</Badge>
                <Badge variant="info" solid icon={false}>
                  3 new
                </Badge>
              </p>
              <Progress label="Invoices paid this month" value={62} />
              <pre className="overflow-x-auto border border-border bg-muted px-2 py-1 font-mono text-[12px] leading-relaxed">
                {`$ curl -s https://api.example.com/v1/invoices/INV-1043\n{ "status": "overdue", "amount": 380.50 }`}
              </pre>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Alert variant="info" title="Bank details changed">
            New invoices show the new account number from 1 November.
          </Alert>
          <Alert variant="success" title="Payment received">
            Harbour Street Bakery paid INV-1042 in full.
          </Alert>
          <Alert variant="warning" title="Two invoices due this week" actions={<Button size="sm">Send reminders</Button>} />
          <Alert variant="destructive" title="Card payment failed" announce={false}>
            Okafor &amp; Lund&apos;s card was declined. <TextLink href="#preview-retry">Try again</TextLink>
          </Alert>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Tabs
            label="Customer"
            size="sm"
            panelClassName="p-3"
            tabs={[
              { id: "activity", label: "Activity", content: <p className="text-[13px]">Invoice INV-1043 sent on 28 September, opened twice.</p> },
              { id: "invoices", label: "Invoices", count: 4, content: <p className="text-[13px]">Four invoices, one overdue.</p> },
              { id: "contacts", label: "Contacts", content: <p className="text-[13px]">Mere Ngata, accounts.</p> },
              { id: "files", label: "Files", disabled: true, content: null },
            ]}
          />
          <Card>
            <CardHeader>
              <CardTitle as="h4">Team plan</CardTitle>
              <CardDescription>Up to 10 people, unlimited invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <span className="text-[20px] font-bold tabular-nums">$24</span> <span className="text-muted-foreground">a month</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" size="sm">
                Choose Team
              </Button>
              <Button size="sm" onClick={() => setDialog(true)}>
                Open a dialog
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Delete Okafor & Lund?"
        description="Their four invoices stay, under “Former customers”."
        size="sm"
        footer={
          <>
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setDialog(false)}>
              Delete customer
            </Button>
          </>
        }
      >
        <p>This can&apos;t be undone. You can add them again later.</p>
      </Dialog>
    </div>
  );
}
