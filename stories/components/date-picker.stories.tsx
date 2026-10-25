import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { addDays, formatDate, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Button } from "@/registry/plainspoken/ui/button";
import { DatePicker, type DatePickerProps } from "@/registry/plainspoken/ui/date-picker";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Measure } from "../support/measure";

const TODAY = "2026-10-19";

const meta: Meta<typeof DatePicker> = {
  title: "Components/Forms/Date picker",
  component: DatePicker,
  args: { today: TODAY },
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

/** In a Field, wired the way a form should: the hint shows the date in words, onError fills the Field's error. */
function Demo({ label = "Date", hint, initial = TODAY, required, ...rest }: Partial<DatePickerProps> & { label?: string; hint?: string; initial?: ISODate | null }) {
  const [v, setV] = useState<ISODate | null>(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Field label={label} required={required} hint={hint ?? (v ? formatDate(v, { dateStyle: "full" }, "en-GB") : "YYYY-MM-DD")} error={error}>
        <DatePicker today={TODAY} locale="en-GB" {...rest} value={v} onChange={setV} onError={setError} />
      </Field>
      <p className="text-[13px] text-muted-foreground">
        value: <code>{v ?? "null"}</code>
      </p>
    </div>
  );
}

/**
 * Type a date (checked on Enter or when leaving the field), or open the calendar with the button
 * or Alt+Down. In the calendar, Escape closes it and puts focus back on the button; choosing a day
 * puts focus back in the field.
 */
export const Default: Story = { render: () => <Demo /> };

/** Uncontrolled, every prop in the Controls panel. Outside a Field it needs an aria-label. */
export const Playground: Story = {
  args: { defaultValue: "2026-10-23", "aria-label": "Date", showWeekNumbers: false, weekStartsOn: 1 },
  argTypes: {
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    weekStartsOn: { control: "inline-radio", options: [0, 1] },
    isDisabled: { control: false },
  },
};

/** Starts empty; clearing the field is allowed. */
export const Empty: Story = { render: () => <Demo initial={null} /> };

/** Weekdays in the next 30 days only, and required. Try typing 2026-10-24 (a Saturday), 2026-02-30, or nothing. */
export const WithLimits: Story = {
  render: () => (
    <Demo
      label="Maintenance window"
      initial={null}
      required
      min={TODAY}
      max={addDays(TODAY, 30)}
      isDisabled={(d) => weekday(d) === 0 || weekday(d) === 6}
      hint="A weekday in the next 30 days"
      showWeekNumbers
    />
  ),
};

/** The error state as it looks after a bad date was typed and checked. */
export const WithError: Story = {
  render: () => (
    <Field label="Renewal date" error="Not a date. Use YYYY-MM-DD, e.g. 2026-10-19">
      <DatePicker today={TODAY} locale="en-GB" defaultValue={null} />
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field label="Contract start" hint="Set by your account manager">
      <DatePicker today={TODAY} locale="en-GB" defaultValue="2026-01-05" disabled />
    </Field>
  ),
};

/** Four heights. The text box and the button are each exactly a control tall, and line up with a Select and a Button of the same size. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className={`ctl-${s} flex items-center gap-2`}>
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <DatePicker aria-label={`Date (${s})`} today={TODAY} locale="en-GB" defaultValue="2026-10-19" />
            <Select aria-label="Time" options={["Morning", "Afternoon"]} />
            <Button>Book</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** Next to other fields in a form row, with ISO week numbers in the calendar. Each limits the other. */
export const InAForm: Story = {
  render: function Render() {
    const [from, setFrom] = useState<ISODate | null>("2026-10-01");
    const [to, setTo] = useState<ISODate | null>(TODAY);
    return (
      <form className="flex flex-wrap items-start gap-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="From">
          <DatePicker value={from} onChange={setFrom} max={to ?? undefined} today={TODAY} locale="en-GB" showWeekNumbers />
        </Field>
        <Field label="To">
          <DatePicker value={to} onChange={setTo} min={from ?? undefined} today={TODAY} locale="en-GB" showWeekNumbers />
        </Field>
      </form>
    );
  },
};

/** Near the bottom of the window the calendar opens above the field instead. */
export const NearTheBottom: Story = {
  render: () => (
    <div className="flex h-[640px] flex-col justify-end">
      <Demo label="Due date" />
    </div>
  ),
};

/**
 * For comparison: the browser's own `<input type="date">`. On phones it opens the system wheel or
 * calendar, which is hard to beat there; on desktop it looks different in every browser and shows
 * the date in the OS locale's order, not ISO.
 */
export const NativeForComparison: Story = {
  render: function Render() {
    const [v, setV] = useState(TODAY);
    return (
      <div className="flex max-w-sm flex-col gap-2">
        <Field label="Date (native)">
          <Input type="date" value={v} onChange={(e) => setV(e.target.value)} className="w-fit" />
        </Field>
        <p className="text-[13px] text-muted-foreground">
          value: <code>{v || "empty"}</code>
        </p>
      </div>
    );
  },
};
