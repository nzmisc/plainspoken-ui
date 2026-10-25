import { TrendList, TrendsPanel } from "@/registry/plainspoken/blocks/social/trends";
import { TRENDS } from "@/registry/plainspoken/blocks/social/data";

/** The side column's panel, and the numbered list Explore shows. */
export default function SocialTrendsDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <TrendsPanel count={4} className="w-80" />
      <TrendList numbered trends={TRENDS.slice(4, 8)} className="w-80 border border-border" />
    </div>
  );
}
