import { Accordion } from "@/registry/plainspoken/ui/accordion";
import { cn } from "@/lib/utils";

export interface LandingQuestion {
  id: string;
  q: string;
  /** The answer as plain text; blank lines start new paragraphs. Plain, so it can go into FAQPage structured data as it is. */
  a: string;
}

export interface LandingFaqProps {
  questions: LandingQuestion[];
  /** Ids of the questions open at first */
  defaultOpen?: string[];
  className?: string;
}

/**
 * Frequently asked questions as an Accordion: native <details>, so it works without script and
 * the browser's find-in-page opens the answer that matches. Answers are plain text, the same
 * text you put in the page's FAQPage structured data (see faqJsonLd).
 */
export function LandingFaq({ questions, defaultOpen, className }: LandingFaqProps) {
  return (
    <Accordion
      className={cn("max-w-3xl bg-background text-[15px]", className)}
      defaultOpen={defaultOpen}
      items={questions.map((x) => ({
        id: x.id,
        title: x.q,
        content: (
          <div className="flex max-w-[68ch] flex-col gap-2 py-1">
            {x.a.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ),
      }))}
    />
  );
}

/** schema.org FAQPage data for the same questions, for a <script type="application/ld+json"> */
export function faqJsonLd(questions: LandingQuestion[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };
}
