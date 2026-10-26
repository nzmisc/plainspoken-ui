import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingNav } from "@/registry/plainspoken/blocks/landing/nav";
import { NAV, PRODUCT, href } from "@/content/landing/content";

const meta: Meta<typeof LandingNav> = {
  title: "Blocks/Landing page/Landing nav",
  component: LandingNav,
  parameters: { layout: "fullscreen" },
  args: { brand: PRODUCT.name, homeHref: href.home, links: NAV, signUp: { label: "Start free", href: href.signup }, currentHref: href.home },
  decorators: [(S) => <div className="h-[200vh]">{S()}<p className="p-4 text-muted-foreground">Scroll: the bar stays at the top.</p></div>],
};
export default meta;
type Story = StoryObj<typeof LandingNav>;

export const Default: Story = {};

/** On the pricing page, Pricing is marked; section anchors never are. */
export const OnPricing: Story = { args: { currentHref: href.pricing } };

/** With a secondary Sign in link. */
export const WithSignIn: Story = { args: { signIn: { label: "Sign in", href: "/sign-in" } } };

/** On a phone: Menu opens a panel with the links and the button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
