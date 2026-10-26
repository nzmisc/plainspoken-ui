"use client";

import Link from "next/link";
import { useState } from "react";
import { LandingCheckList } from "@/registry/plainspoken/blocks/landing/section";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { buttonVariants } from "@/registry/plainspoken/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { cn } from "@/lib/utils";

export type LandingBilling = "monthly" | "yearly";

export interface LandingPlan {
  key: string;
  name: string;
  description: string;
  /** Price per month when paid monthly, in whole dollars. 0 for free. */
  monthly: number;
  /** Price per year when paid yearly */
  yearly: number;
  /** The button's words */
  cta: string;
  /** A badge on the plan to recommend: "Most teams pick this" */
  highlight?: string;
  features: string[];
}

export interface LandingPricingProps {
  plans: LandingPlan[];
  /** The sign-up page. Each plan's button adds ?plan=…&billing=… to it. */
  signupHref: string;
  /** The period shown first. Default yearly. */
  defaultBilling?: LandingBilling;
  /** Next to the switch: "2 months free" */
  yearlyNote?: string;
  /** Plan names as h2 or h3, to fit the page. Default h3. */
  headingLevel?: "h2" | "h3";
  className?: string;
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/**
 * Plans side by side in cards, with a Monthly / Yearly switch (a SegmentedControl, so arrow keys
 * work and screen readers say "1 of 2") that changes every price at once. Yearly prices are shown
 * per month with the yearly total under them, the way people compare. The recommended plan has
 * a badge and a primary button; the others have outline buttons, so there is one main action.
 */
export function LandingPricing({ plans, signupHref, defaultBilling = "yearly", yearlyNote = "2 months free", headingLevel = "h3", className }: LandingPricingProps) {
  const [billing, setBilling] = useState<LandingBilling>(defaultBilling);
  return (
    <div data-slot="landing-pricing" className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Billing period"
          value={billing}
          onChange={setBilling}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        {yearlyNote && (
          <Badge variant="success" icon={false}>
            Yearly: {yearlyNote}
          </Badge>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {billing} prices.
      </p>
      <ul className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const free = p.monthly === 0;
          const perMonth = billing === "monthly" ? p.monthly : p.yearly / 12;
          return (
            <li key={p.key} className="flex">
              <Card className={cn("flex-1", p.highlight && "border-2 border-primary")}>
                <CardHeader>
                  <CardTitle as={headingLevel} className="flex flex-wrap items-center gap-2 text-[18px]">
                    {p.name}
                    {p.highlight && (
                      <Badge variant="info" solid icon={false}>
                        {p.highlight}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="flex flex-col">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[36px] leading-none font-bold tabular-nums">{usd(Math.round(perMonth))}</span>
                      <span className="text-muted-foreground">{free ? "forever" : "a month"}</span>
                    </span>
                    <span className="mt-1 text-[13px] text-muted-foreground">
                      {free ? "No card needed" : billing === "yearly" ? `${usd(p.yearly)} billed yearly` : `Billed monthly, or ${usd(p.yearly)} a year`}
                    </span>
                  </p>
                  <LandingCheckList items={p.features} />
                </CardContent>
                <CardFooter>
                  <Link
                    href={`${signupHref}?plan=${p.key}&billing=${billing}`}
                    className={buttonVariants({ variant: p.highlight ? "primary" : "outline", className: "w-full" })}
                    aria-label={`${p.cta}: ${p.name} plan`}
                  >
                    {p.cta}
                  </Link>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
