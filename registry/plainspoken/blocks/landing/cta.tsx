import { useId, type ReactNode } from "react";
import { Mail } from "@/registry/plainspoken/lib/icons";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { cn } from "@/lib/utils";

export interface LandingCtaProps {
  /** The band's h2 */
  title: ReactNode;
  text?: ReactNode;
  /** Where the form goes: the sign-up page, which gets ?email=… */
  action: string;
  /** The button's words. Default "Start free". */
  button?: string;
  /** Small print under the form */
  note?: ReactNode;
  /**
   * What to show: the empty form, the form with an error under the field, or the message that
   * replaces it once someone has signed up. Your form handler decides; the band only draws it.
   */
  state?: "idle" | "error" | "success";
  /** The error under the field, for state="error" */
  error?: string;
  /** The address they signed up with, for state="success" (and the field's value for "error") */
  email?: string;
  className?: string;
}

/**
 * The closing call to action of a marketing page: a heading, a sentence and an email signup in
 * one row (Field, Input and a primary Button, the same height). A plain GET form, so it works
 * without script by taking the address to the sign-up page. It draws the error and success states
 * too, given by `state`, so the form logic can live wherever you like.
 */
export function LandingCta({ title, text, action, button = "Start free", note, state = "idle", error, email, className }: LandingCtaProps) {
  const id = useId();
  return (
    <section aria-labelledby={id} data-slot="landing-cta" className={cn("border-b border-border bg-muted", className)}>
      <div className="mx-auto grid max-w-6xl items-center gap-x-12 gap-y-6 px-4 py-12 sm:py-16 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 id={id} className="text-[26px] leading-tight font-bold text-balance sm:text-[30px]">
            {title}
          </h2>
          {text != null && <p className="text-[16px] leading-relaxed text-muted-foreground">{text}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {state === "success" ? (
            <Alert variant="success" title="Check your inbox" announce>
              We sent a link to <b className="font-semibold">{email ?? "your address"}</b>. It opens your new account; nothing else to fill in.
            </Alert>
          ) : (
            <form action={action} method="get" noValidate={state === "error"} className="ctl-lg">
              <Field label="Work email" error={state === "error" ? (error ?? "Enter an email address, like you@company.com") : undefined}>
                <span className="flex gap-2">
                  <Input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    prefix={Mail}
                    defaultValue={email}
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" variant="primary">
                    {button}
                  </Button>
                </span>
              </Field>
            </form>
          )}
          {note != null && <p className="text-[13px] text-muted-foreground">{note}</p>}
        </div>
      </div>
    </section>
  );
}
