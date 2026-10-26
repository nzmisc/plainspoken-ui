import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Card, CardContent } from "@/registry/plainspoken/ui/card";
import { cn } from "@/lib/utils";

export interface LandingTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export interface LandingTestimonialsProps {
  testimonials: LandingTestimonial[];
  className?: string;
}

/**
 * What customers say: each quote in a card, as a <figure> with the words in a <blockquote> and
 * the person (avatar with initials, name, role, company) in the caption, so the attribution is
 * tied to the quote for screen readers too. Three across on wide screens.
 */
export function LandingTestimonials({ testimonials, className }: LandingTestimonialsProps) {
  return (
    <ul data-slot="landing-testimonials" className={cn("grid gap-4 md:grid-cols-3", className)}>
      {testimonials.map((t) => (
        <li key={t.name} className="flex">
          <Card className="flex-1">
            <CardContent className="flex h-full flex-col">
              <figure className="flex h-full flex-col justify-between gap-5">
                <blockquote className="text-[16px] leading-relaxed">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="flex items-center gap-2.5">
                  <Avatar name={t.name} size={36} />
                  <span className="flex flex-col leading-snug">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {t.role}, {t.company}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
