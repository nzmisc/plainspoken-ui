import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { addDays, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Button } from "@/registry/plainspoken/ui/button";
import { Calendar, type CalendarProps, type DateRange } from "@/registry/plainspoken/ui/calendar";

/** Stories pin "today" so screenshots don't change from day to day. */
const TODAY = "2026-10-19";

const meta: Meta<typeof Calendar> = {
  title: "Components/Data display/Calendar",
  component: Calendar,
  args: { today: TODAY },
};
export default meta;
type Story = StoryObj<typeof Calendar>;

type Extra = Partial<Omit<CalendarProps, "mode" | "value" | "onChange" | "defaultValue">>;

function Single({ initial = TODAY, ...rest }: Extra & { initial?: ISODate | null }) {
  const [v, setV] = useState<ISODate | null>(initial);
  return (
    <div className="flex flex-col gap-1">
      <Calendar today={TODAY} {...rest} mode="single" value={v} onChange={setV} />
      <p className="text-[13px] text-muted-foreground">
        value: <code>{v ?? "null"}</code>
      </p>
    </div>
  );
}

function Range({ initial = null, ...rest }: Extra & { initial?: DateRange | null }) {
  const [v, setV] = useState<DateRange | null>(initial);
  return (
    <div className="flex flex-col gap-1">
      <Calendar today={TODAY} {...rest} mode="range" value={v} onChange={setV} />
      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>
          value: <code>{v ? `${v.start} → ${v.end ?? "(pick the end)"}` : "null"}</code>
        </span>
        {v && (
          <Button size="xs" onClick={() => setV(null)}>
            Clear
          </Button>
        )}
      </p>
    </div>
  );
}

/**
 * One month, Monday first, today outlined, the selection filled. Click a day, or Tab in and use
 * the keyboard: arrows by day and week, Home/End to the week's ends, PageUp/PageDown by month,
 * Shift+PageUp/PageDown by year, Enter or Space to select.
 */
export const Default: Story = { render: () => <Single /> };

/** Uncontrolled, with every prop in the Controls panel. */
export const Playground: Story = {
  args: { defaultValue: "2026-10-23", numberOfMonths: 1, weekStartsOn: 1, showWeekNumbers: false, size: "compact" },
  argTypes: {
    weekStartsOn: { control: "inline-radio", options: [0, 1] },
    size: { control: "inline-radio", options: ["compact", "large"] },
    renderDay: { control: false },
    describeDay: { control: false },
    isDisabled: { control: false },
  },
};

/** Nothing selected yet: opens on today's month. */
export const NoSelection: Story = { render: () => <Single initial={null} /> };

/**
 * No `today` and no value: on the server and while hydrating the calendar is laid out invisibly,
 * then shows the viewer's month once it runs in the browser (here at once, since Storybook doesn't
 * server-render).
 */
export const ViewersToday: Story = { render: () => <Calendar /> };

/** ISO week numbers in the first column; this one starts weeks on Sunday. */
export const WeekNumbersSundayFirst: Story = { render: () => <Single showWeekNumbers weekStartsOn={0} /> };

/** Bookable from today for 45 days, weekdays only. Disabled days are struck through and can still be arrowed over. */
export const MinMaxAndDisabled: Story = {
  render: () => (
    <Single initial={null} min={TODAY} max={addDays(TODAY, 45)} isDisabled={(d) => weekday(d) === 0 || weekday(d) === 6} showWeekNumbers />
  ),
};

/** First click sets the start, second the end; the range is previewed under the pointer (or keyboard focus) in between. */
export const RangeSelection: Story = { render: () => <Range initial={{ start: "2026-10-12", end: "2026-10-23" }} /> };

/** A range that spans months, shown two at a time. Outside days are hidden so a date only appears once. */
export const TwoMonthRange: Story = {
  render: () => <Range numberOfMonths={2} initial={{ start: "2026-10-26", end: "2026-11-13" }} />,
};

/** Three months, e.g. for picking a billing period. Wraps on narrow screens. */
export const ThreeMonths: Story = { render: () => <Single numberOfMonths={3} showWeekNumbers /> };

/** Month and weekday names come from Intl, so any locale works. Week start is separate from locale. */
export const Locales: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {(
        [
          ["en-US", 0],
          ["de-DE", 1],
          ["fr-FR", 1],
          ["ja-JP", 0],
        ] as const
      ).map(([locale, start]) => (
        <div key={locale} className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold">{locale}</p>
          <Single locale={locale} weekStartsOn={start} />
        </div>
      ))}
    </div>
  ),
};

/** size="large": the grid fills the width and each day has room for content from renderDay. */
export const Large: Story = {
  render: () => (
    <Single
      size="large"
      showWeekNumbers
      renderDay={(d) => (weekday(d) === 3 ? <span className="truncate text-[12px] font-normal text-muted-foreground">Bin day</span> : null)}
      describeDay={(d) => (weekday(d) === 3 ? "bin day" : undefined)}
    />
  ),
};

/** At phone width two months stack. */
export const PhoneWidth: Story = {
  render: () => (
    <div className="w-[343px] border border-dashed border-border p-2">
      <Range numberOfMonths={2} initial={{ start: "2026-10-26", end: "2026-11-13" }} />
    </div>
  ),
};
