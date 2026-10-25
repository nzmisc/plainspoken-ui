import { LandingPlanComparison } from "@/registry/plainspoken/blocks/landing/plan-comparison";

export default function LandingPlanComparisonDemo() {
  return (
    <LandingPlanComparison
      plans={["Hobby", "Team", "Business"]}
      highlight="Team"
      caption="A check mark means included, a dash not included."
      groups={[
        {
          group: "Monitoring",
          rows: [
            { feature: "Checks", values: ["10", "100", "500"] },
            { feature: "Shortest interval", values: ["5 min", "30 s", "10 s"] },
            { feature: "Certificate expiry", values: [true, true, true] },
          ],
        },
        {
          group: "Alerts",
          rows: [
            { feature: "SMS and phone calls", values: [false, "200 a month", "1,000 a month"] },
            { feature: "On-call schedules", values: [false, true, true] },
          ],
        },
      ]}
    />
  );
}
