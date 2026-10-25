import { Meter } from "@/registry/plainspoken/ui/progress";

/** Meter is for a measurement in a range, not a task. Past warn or crit it changes colour and gains a symbol. */
export default function ProgressMeter() {
  return (
    <dl className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
      <dt>Storage</dt>
      <dd>
        <Meter label="Storage used" value={41} warn={80} crit={95} valueText="41% · 29.5 GB free" />
      </dd>
      <dt>Seats</dt>
      <dd>
        <Meter label="Seats used" value={9} max={10} warn={8} crit={10} valueText="9 of 10" />
      </dd>
      <dt>API calls</dt>
      <dd>
        <Meter label="API calls this month" value={98} warn={80} crit={95} />
      </dd>
    </dl>
  );
}
