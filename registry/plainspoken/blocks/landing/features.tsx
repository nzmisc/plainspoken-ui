import type { Glyph } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface LandingFeature {
  icon: Glyph;
  title: string;
  text: string;
}

export interface LandingFeaturesProps {
  features: LandingFeature[];
  /** Columns on wide screens. Default 3. */
  columns?: 2 | 3;
  className?: string;
}

/**
 * What the product does, as a grid of short items: an icon in a square, a bold title and two
 * lines of text. The grid is ruled like a table (one line between cells, none doubled), with no
 * box shadow or rounded cards. Three columns on wide screens, two on tablets, one on phones.
 */
export function LandingFeatures({ features, columns = 3, className }: LandingFeaturesProps) {
  return (
    <ul
      data-slot="landing-features"
      className={cn(
        "grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {features.map((f) => (
        <li key={f.title} className="flex flex-col gap-2 bg-background p-5">
          <span className="flex size-9 items-center justify-center border border-border bg-muted text-foreground">
            <Icon icon={f.icon} size={18} />
          </span>
          <h3 className="text-[16px] font-bold">{f.title}</h3>
          <p className="text-muted-foreground">{f.text}</p>
        </li>
      ))}
    </ul>
  );
}
