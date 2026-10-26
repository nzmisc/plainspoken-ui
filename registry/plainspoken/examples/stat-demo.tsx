import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";

/**
 * Each change is said in words and with an arrow, as well as in green or red. Response time going
 * down is good news, so it says sentiment: "good".
 */
export default function StatDemo() {
  return (
    <StatGroup>
      <Stat label="Revenue" value="€12,400" change={{ value: "8.2%", direction: "up", period: "vs last month" }} />
      <Stat label="New customers" value="38" change={{ value: "5", direction: "down", period: "vs last month" }} />
      <Stat label="Response time" value="182 ms" change={{ value: "24 ms", direction: "down", sentiment: "good", period: "vs last week" }} />
      <Stat label="Open tickets" value="14" change={{ direction: "flat", period: "since yesterday" }} hint="3 waiting on customers" />
    </StatGroup>
  );
}
