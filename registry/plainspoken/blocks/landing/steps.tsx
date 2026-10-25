import { cn } from "@/lib/utils";

export interface LandingStep {
  title: string;
  text: string;
  /** Small print under the text: how long it takes, a number */
  detail?: string;
}

export interface LandingStepsProps {
  steps: LandingStep[];
  className?: string;
}

/**
 * How it works, in three or four numbered steps side by side (stacked on phones). A real ordered
 * list, so the numbers are read out; each number sits in a square on a rule that runs through
 * the row, so the steps read as one sequence.
 */
export function LandingSteps({ steps, className }: LandingStepsProps) {
  return (
    <ol data-slot="landing-steps" className={cn("grid gap-8 md:grid-cols-3 md:gap-6", className)}>
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex flex-col gap-2">
          <div className="flex items-center gap-3" aria-hidden>
            <span className="flex size-9 shrink-0 items-center justify-center border border-foreground bg-foreground text-[16px] font-bold text-background tabular-nums">
              {i + 1}
            </span>
            {i < steps.length - 1 && <span className="hidden h-px flex-1 bg-border md:block" />}
          </div>
          <h3 className="text-[16px] font-bold">
            <span className="sr-only">Step {i + 1}: </span>
            {s.title}
          </h3>
          <p className="text-muted-foreground">{s.text}</p>
          {s.detail && <p className="text-[13px] font-medium">{s.detail}</p>}
        </li>
      ))}
    </ol>
  );
}
