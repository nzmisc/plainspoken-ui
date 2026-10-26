// What each page of the landing demo shows, as compositions of blocks and content. The route files
// add metadata and structured data around these; Storybook's demo story renders them as they are.
import type { ReactNode } from "react";
import { Accordion, AccordionItem } from "@/registry/plainspoken/ui/accordion";
import { LandingCta } from "@/registry/plainspoken/blocks/landing/cta";
import { LandingFaq } from "@/registry/plainspoken/blocks/landing/faq";
import { LandingFeatureSplit } from "@/registry/plainspoken/blocks/landing/feature-split";
import { LandingFeatures } from "@/registry/plainspoken/blocks/landing/features";
import { LandingFooter } from "@/registry/plainspoken/blocks/landing/footer";
import { LandingHero } from "@/registry/plainspoken/blocks/landing/hero";
import { LandingLogos } from "@/registry/plainspoken/blocks/landing/logos";
import { LandingNav } from "@/registry/plainspoken/blocks/landing/nav";
import { LandingPlanComparison } from "@/registry/plainspoken/blocks/landing/plan-comparison";
import { LandingPricing } from "@/registry/plainspoken/blocks/landing/pricing";
import { LandingProductShot } from "@/registry/plainspoken/blocks/landing/product-shot";
import { LandingCheckList, LandingPageHeader, LandingSection } from "@/registry/plainspoken/blocks/landing/section";
import { LandingSignupForm, type LandingSignupFormProps } from "@/registry/plainspoken/blocks/landing/signup-form";
import { LandingSteps } from "@/registry/plainspoken/blocks/landing/steps";
import { LandingTestimonials } from "@/registry/plainspoken/blocks/landing/testimonials";
import { LandingAlertTimeline, LandingHeartbeatTable, LandingStatusPagePreview } from "@/registry/plainspoken/blocks/landing/visuals";
import {
  COMPARISON,
  CTA,
  CUSTOMERS,
  FAQ,
  FEATURES,
  FOOTER,
  HERO,
  NAV,
  PLANS,
  PRODUCT,
  SPLITS,
  STEPS,
  TESTIMONIALS,
  href,
} from "@/content/landing/content";

export const BILLING_FAQ = FAQ.filter((x) => ["free", "yearly", "sms", "cancel", "data"].includes(x.id));

/** Nav, main and footer around every page. `currentHref` stands in for the router's pathname (Storybook). */
export function LandingFrame({ children, currentHref }: { children: ReactNode; currentHref?: string }) {
  return (
    <>
      <LandingNav brand={PRODUCT.name} homeHref={href.home} links={NAV} signUp={{ label: "Start free", href: href.signup }} currentHref={currentHref} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <LandingFooter brand={PRODUCT.name} tagline={PRODUCT.tagline} columns={FOOTER.columns} smallPrint={FOOTER.smallPrint} />
    </>
  );
}

export function HomeView() {
  return (
    <>
      <LandingHero
        eyebrow={HERO.eyebrow}
        title={HERO.title}
        lead={HERO.lead}
        primary={{ label: "Start monitoring free", href: href.signup }}
        secondary={{ label: "See pricing", href: href.section("pricing") }}
        note={HERO.note}
        visual={<LandingProductShot product={PRODUCT.name} />}
      />
      <LandingLogos title={CUSTOMERS.title} names={CUSTOMERS.names} />
      <LandingSection
        id="features"
        eyebrow="Features"
        title="Everything a small team needs to know it's up"
        lead="Six things, done properly. No agents to install and nothing to host: point Keepwatch at a URL and it starts checking."
      >
        <LandingFeatures features={FEATURES} />
      </LandingSection>
      <LandingSection id="how-it-works" tone="muted" eyebrow="How it works" title="Set up in the time it takes to make coffee">
        <LandingSteps steps={STEPS} />
      </LandingSection>
      <LandingSection eyebrow="A closer look" title="Built for the 3 a.m. version of you" lead="What happens when something actually breaks, and what your customers see while you fix it.">
        <div className="flex flex-col gap-16">
          <LandingFeatureSplit {...SPLITS.alerts} visual={<LandingAlertTimeline />} />
          <LandingFeatureSplit {...SPLITS.status} visual={<LandingStatusPagePreview />} reverse />
          <LandingFeatureSplit {...SPLITS.heartbeats} visual={<LandingHeartbeatTable />} />
        </div>
      </LandingSection>
      <LandingSection tone="muted" eyebrow="Customers" title="Fewer pages, calmer on-call">
        <LandingTestimonials testimonials={TESTIMONIALS} />
      </LandingSection>
      <LandingSection
        id="pricing"
        eyebrow="Pricing"
        title="Free to start, simple to grow"
        lead={
          <>
            Every plan has every region and confirmed alerts. Pay for more checks, faster intervals and more people.{" "}
            <a href={href.pricing} className="text-link underline underline-offset-2 visited:text-link-visited">
              Compare every feature
            </a>
            .
          </>
        }
      >
        <LandingPricing plans={PLANS} signupHref={href.signup} />
        <Accordion>
          <AccordionItem title="Compare every feature" meta={`${COMPARISON.reduce((n, g) => n + g.rows.length, 0)} features`}>
            <LandingPlanComparison
              plans={PLANS.map((p) => p.name)}
              groups={COMPARISON}
              highlight="Team"
              caption="A check mark means included, a dash not included."
              className="my-1"
            />
          </AccordionItem>
        </Accordion>
      </LandingSection>
      <LandingSection id="faq" tone="muted" eyebrow="FAQ" title="Questions people ask before signing up">
        <LandingFaq questions={FAQ} />
      </LandingSection>
      <LandingCta
        title={CTA.title}
        text={CTA.text}
        action={href.signup}
        note="No card needed. You can delete your account and data at any time."
        className="bg-background"
      />
    </>
  );
}

export function PricingView() {
  return (
    <>
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:pt-16">
          <LandingPageHeader
            title="Pricing"
            lead="Start free and stay free for a personal site. Pay when you need faster checks, phone alerts and a team on call. Prices in US dollars, before tax."
          />
          <LandingPricing plans={PLANS} signupHref={href.signup} headingLevel="h2" />
        </div>
      </div>
      <LandingSection id="compare" tone="muted" title="Compare every feature" lead="Everything in one table. Anything not listed is on every plan.">
        <LandingPlanComparison
          plans={PLANS.map((p) => p.name)}
          groups={COMPARISON}
          highlight="Team"
          caption="Features of the Hobby, Team and Business plans. A check mark means included, a dash not included."
        />
      </LandingSection>
      <LandingSection id="billing-faq" title="Billing questions">
        <LandingFaq questions={BILLING_FAQ} />
      </LandingSection>
      <LandingCta title={CTA.title} text={CTA.text} action={href.signup} note="No card needed for the free plan or the 14-day trial." />
    </>
  );
}

const INCLUDED = [
  "Checks from all six regions from the first minute",
  "Confirmed alerts, so the first page you get is a real one",
  "A status page on a keepwatch.example address",
  "Your data kept in the EU",
];

/** The sign-up page; `form` sets the form's state (error, success) for the stories. */
export function SignupView({ form }: { form?: Partial<LandingSignupFormProps> }) {
  return (
    <div className="bg-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <LandingPageHeader title="Start keeping watch" lead="Ten checks free, for as long as you like. Paid plans start with 14 days on us." />
          <LandingSignupForm plans={PLANS.map((p) => ({ ...p, summary: p.features[0] }))} defaultPlan="team" {...form} />
        </div>
        <aside aria-label="What you get" className="flex min-w-0 flex-col gap-6 lg:pt-24">
          <section className="flex flex-col gap-2">
            <h2 className="text-[18px] font-bold">Every account gets</h2>
            <LandingCheckList items={INCLUDED} />
          </section>
          <LandingTestimonials testimonials={TESTIMONIALS.slice(0, 1)} className="md:grid-cols-1" />
        </aside>
      </div>
    </div>
  );
}
