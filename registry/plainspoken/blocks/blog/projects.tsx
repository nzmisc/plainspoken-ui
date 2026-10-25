import { Badge, type BadgeVariant } from "@/registry/plainspoken/ui/badge";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface BlogProject {
  name: string;
  href: string;
  /** What it does, in a sentence */
  description: string;
  /** active, maintained (fixes only) or archived */
  status?: "active" | "maintained" | "archived";
  /** Small print after the description: language, licence, stars */
  meta?: string;
}

export interface BlogProjectsProps {
  projects: BlogProject[];
  className?: string;
}

const STATUS: Record<NonNullable<BlogProject["status"]>, { variant: BadgeVariant; word: string }> = {
  active: { variant: "success", word: "active" },
  maintained: { variant: "default", word: "maintained" },
  archived: { variant: "default", word: "archived" },
};

/**
 * Side projects, one per row: the name as a link, a badge saying whether it is still worked on,
 * what it does, and a line of small print. Plain enough for a home page's side column.
 */
export function BlogProjects({ projects, className }: BlogProjectsProps) {
  return (
    <ul data-slot="blog-projects" className={cn("flex flex-col border-t border-border", className)}>
      {projects.map((p) => (
        <li key={p.href} className="flex flex-col gap-0.5 border-b border-border py-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <a href={p.href} className={cn(linkVariants(), "font-semibold")}>
              {p.name}
            </a>
            {p.status && (
              <Badge variant={STATUS[p.status].variant} icon={false}>
                {STATUS[p.status].word}
              </Badge>
            )}
          </p>
          <p>{p.description}</p>
          {p.meta && <p className="text-[13px] text-muted-foreground">{p.meta}</p>}
        </li>
      ))}
    </ul>
  );
}
