"use client";

import { useId, useState } from "react";
import { CircleX, Lock, Mail, User } from "@/registry/plainspoken/lib/icons";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";

export interface LandingSignupPlan {
  key: string;
  name: string;
  monthly: number;
  yearly: number;
  /** One line under the plan's name */
  summary: string;
}

export type LandingSignupField = "name" | "email" | "password" | "terms";

export interface LandingSignupFormProps {
  plans: LandingSignupPlan[];
  /** The plan chosen at first (from the pricing page's ?plan=) */
  defaultPlan?: string;
  defaultBilling?: "monthly" | "yearly";
  /** Where the form posts. Default: the current page, by GET. */
  action?: string;
  /**
   * What to draw: the empty form; the form with `errors` under their fields and a summary at the
   * top linking to each; or the account-created message. Your handler decides.
   */
  state?: "idle" | "error" | "success";
  errors?: Partial<Record<LandingSignupField, string>>;
  /** Values to fill in, e.g. after a failed submission, or the email from the landing page's form */
  values?: { name?: string; email?: string; company?: string };
  className?: string;
}

const FIELD_LABEL: Record<LandingSignupField, string> = { name: "Your name", email: "Work email", password: "Password", terms: "Terms" };
const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/**
 * A sign-up form in a card: name, work email, password, company and team size, the plan as
 * radios with prices (a Monthly / Yearly switch above them), the terms, and one primary button.
 * Every field is a Field, so labels, hints and errors are wired for screen readers. With
 * state="error" it lists the problems at the top, each a link to its field (the GOV.UK error
 * summary pattern); with state="success" a message replaces the form.
 */
export function LandingSignupForm({
  plans,
  defaultPlan,
  defaultBilling = "yearly",
  action,
  state = "idle",
  errors = {},
  values = {},
  className,
}: LandingSignupFormProps) {
  const uid = useId();
  const fid = (k: LandingSignupField) => `${uid}-${k}`;
  const [plan, setPlan] = useState(defaultPlan ?? plans[1]?.key ?? plans[0]?.key ?? "");
  const [billing, setBilling] = useState<"monthly" | "yearly">(defaultBilling);
  const chosen = plans.find((p) => p.key === plan) ?? plans[0];
  const err = state === "error" ? errors : {};
  const problems = (Object.keys(err) as LandingSignupField[]).filter((k) => err[k]);

  if (state === "success")
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle as="h2">Your account is ready</CardTitle>
          <CardDescription>We sent a confirmation link to {values.email ?? "your email address"}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert variant="success" title="Account created" announce>
            Open the link in the email to add your first check. It is valid for 24 hours.
          </Alert>
          <DescriptionList
            divided
            items={[
              { term: "Plan", description: `${chosen?.name}, billed ${billing}` },
              { term: "Trial", description: chosen && chosen.monthly > 0 ? "14 days, then billed. Cancel any time." : "Free, no trial" },
              { term: "Region", description: "EU (Frankfurt)" },
            ]}
          />
        </CardContent>
      </Card>
    );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">Create your account</CardTitle>
        <CardDescription>Takes a minute. No card needed for the free plan or the trial.</CardDescription>
      </CardHeader>
      <form action={action} method="get" noValidate={state === "error"} className="flex flex-col">
        <CardContent className="flex flex-col gap-4">
          {problems.length > 0 && (
            <Alert variant="destructive" title={`${problems.length === 1 ? "One thing needs" : `${problems.length} things need`} fixing`}>
              <ul className="list-disc pl-5">
                {problems.map((k) => (
                  <li key={k}>
                    <a href={`#${fid(k)}`} className="text-link underline underline-offset-2">
                      {FIELD_LABEL[k]}: {err[k]}
                    </a>
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" id={fid("name")} required error={err.name}>
              <Input name="name" autoComplete="name" prefix={User} defaultValue={values.name} />
            </Field>
            <Field label="Work email" id={fid("email")} required error={err.email}>
              <Input type="email" name="email" autoComplete="email" prefix={Mail} placeholder="you@company.com" defaultValue={values.email} />
            </Field>
          </div>
          <Field label="Password" id={fid("password")} required error={err.password} hint="At least 12 characters. A sentence works well.">
            <Input type="password" name="password" autoComplete="new-password" prefix={Lock} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" hint="Optional. Shown on your status page.">
              <Input name="company" autoComplete="organization" defaultValue={values.company} />
            </Field>
            <Field label="Team size">
              <Select name="team" defaultValue="2-10" options={["Just me", "2-10", "11-50", "51-200", "More than 200"]} className="w-full" />
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-medium">Billing</span>
              <SegmentedControl
                label="Billing period"
                size="sm"
                value={billing}
                onChange={setBilling}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly, 2 months free" },
                ]}
              />
            </div>
            <RadioGroup
              legend="Plan"
              name="plan"
              value={plan}
              onChange={setPlan}
              options={plans.map((p) => ({
                value: p.key,
                label: (
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.monthly === 0
                        ? "free"
                        : billing === "monthly"
                          ? `${usd(p.monthly)} a month`
                          : `${usd(p.yearly)} a year (${usd(Math.round(p.yearly / 12))} a month)`}
                    </span>
                  </span>
                ),
                description: p.summary,
              }))}
            />
          </div>
          <div id={fid("terms")} className="flex flex-col gap-1">
            <Checkbox
              name="terms"
              required
              aria-invalid={err.terms ? true : undefined}
              aria-describedby={err.terms ? `${fid("terms")}-error` : undefined}
              label="I agree to the terms of service and the privacy notice"
              description="Plain English, two pages each. We email you before either changes."
            />
            {err.terms && (
              <p id={`${fid("terms")}-error`} className="text-[13px] text-destructive">
                <Icon icon={CircleX} className="mr-1" />
                {err.terms}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-[13px] text-muted-foreground">
            {chosen && chosen.monthly > 0 ? `${chosen.name}: 14 days free, then billed ${billing}.` : "Free plan: no card, no trial clock."}
          </span>
          <Button type="submit" variant="primary" size="lg">
            Create account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
