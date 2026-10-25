import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingTestimonials } from "@/registry/plainspoken/blocks/landing/testimonials";
import { TESTIMONIALS } from "@/content/landing/content";

const meta: Meta<typeof LandingTestimonials> = {
  title: "Blocks/Landing page/Testimonials",
  component: LandingTestimonials,
  decorators: [(S) => <div className="max-w-6xl">{S()}</div>],
  args: { testimonials: TESTIMONIALS },
};
export default meta;
type Story = StoryObj<typeof LandingTestimonials>;

export const Three: Story = {};

/** One quote, as on the sign-up page. */
export const One: Story = { args: { testimonials: TESTIMONIALS.slice(0, 1), className: "md:grid-cols-1 max-w-md" } };
