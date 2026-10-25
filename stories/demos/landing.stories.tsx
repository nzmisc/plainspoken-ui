import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeView, LandingFrame, PricingView, SignupView } from "@/app/(demos)/demos/landing/_views";
import { href } from "@/content/landing/content";

type Page = "home" | "pricing" | "signup";

/** The landing demo's pages, framed as at /demos/landing. */
function LandingDemo({ page, signup }: { page: Page; signup?: "idle" | "error" | "success" }) {
  return (
    <LandingFrame currentHref={{ home: href.home, pricing: href.pricing, signup: href.signup }[page]}>
      {page === "home" && <HomeView />}
      {page === "pricing" && <PricingView />}
      {page === "signup" && (
        <SignupView
          form={
            signup === "error"
              ? { state: "error", values: { name: "Marta Kos", email: "marta@northwind" }, errors: { email: "Enter an address like you@company.com", terms: "Tick the box to agree to the terms" } }
              : signup === "success"
                ? { state: "success", values: { email: "marta@northwind.example" } }
                : undefined
          }
        />
      )}
    </LandingFrame>
  );
}

const meta: Meta<typeof LandingDemo> = {
  title: "Demos/Landing page",
  component: LandingDemo,
  parameters: { layout: "fullscreen" },
  args: { page: "home" },
  argTypes: {
    page: { control: "inline-radio", options: ["home", "pricing", "signup"] },
    signup: { control: "inline-radio", options: ["idle", "error", "success"] },
  },
};
export default meta;
type Story = StoryObj<typeof LandingDemo>;

/** Keepwatch's landing page: hero with a product shot made of components, features, steps, pictures, quotes, pricing, FAQ. */
export const Home: Story = {};

/** Plans, the full comparison table and billing questions. */
export const Pricing: Story = { args: { page: "pricing" } };

export const SignUp: Story = { args: { page: "signup" } };

export const SignUpErrors: Story = { args: { page: "signup", signup: "error" } };

export const SignUpDone: Story = { args: { page: "signup", signup: "success" } };

export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
