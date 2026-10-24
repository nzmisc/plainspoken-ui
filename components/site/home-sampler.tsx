"use client";

import { useState } from "react";
import { Download, Funnel, RefreshCw, Search } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { Switch } from "@/registry/plainspoken/ui/switch";

const ROWS = [
  { host: "atlas", ip: "100.101.7.12", status: "online", cpu: "12%" },
  { host: "bastion", ip: "100.92.40.3", status: "online", cpu: "3%" },
  { host: "pi-shed", ip: "100.77.8.21", status: "offline", cpu: "–" },
];

/** A small working sample of the components for the home page: a toolbar, a table and a form. */
export function HomeSampler() {
  const [range, setRange] = useState("1h");
  const [live, setLive] = useState(true);
  const [online, setOnline] = useState(false);
  const rows = online ? ROWS.filter((r) => r.status === "online") : ROWS;
  return (
    <div className="border border-border">
      <div className="ctl-sm flex flex-wrap items-center gap-1.5 border-b border-border bg-muted px-2 py-1.5">
        <strong className="mr-1 text-[13px]">Machines</strong>
        <Input prefix={Search} placeholder="Filter" aria-label="Filter machines" className="w-32" />
        <Chip pressed={online} onPressedChange={setOnline}>
          Online only
        </Chip>
        <span className="ml-auto flex items-center gap-1.5">
          <SegmentedControl label="Range" value={range} onChange={setRange} options={["10m", "1h", "24h"]} />
          <IconButton variant="ghost" icon={RefreshCw} label="Refresh" />
          <IconButton variant="ghost" icon={Download} label="Export" />
        </span>
      </div>
      <table className="w-full text-[13px] [&_td]:border-b [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold">
        <thead>
          <tr>
            <th>Host</th>
            <th>Tailnet IP</th>
            <th>Status</th>
            <th className="text-right!">CPU</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.host}>
              <td>
                <a href="#sample" className="text-link underline visited:text-link-visited">
                  {r.host}
                </a>
              </td>
              <td className="font-mono text-[12px]">
                {r.ip} <CopyButton text={r.ip} />
              </td>
              <td className={r.status === "online" ? "text-success" : "text-muted-foreground"}>{r.status}</td>
              <td className="text-right tabular-nums">{r.cpu}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="grid gap-3 p-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <Field label="Name" hint="Shown in the sidebar.">
          <Input defaultValue="atlas" />
        </Field>
        <Field label="Group">
          <Select options={["Servers", "Laptops", "Phones"]} />
        </Field>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Checkbox label="Run the kernel check every 12 hours" defaultChecked />
          <Switch checked={live} onChange={setLive} label="Live updates" />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button variant="primary" type="submit">
            Save
          </Button>
          <Button>Cancel</Button>
          <Button variant="ghost" icon={Funnel} className="ml-auto">
            Advanced
          </Button>
        </div>
      </form>
    </div>
  );
}
