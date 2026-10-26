import { PRODUCT, href } from "@/content/landing/content";
import { pageMetadata } from "../_lib/meta";
import { SignupView } from "../_views";

export const metadata = pageMetadata({
  title: "Create your account",
  description: `Sign up for ${PRODUCT.name}: free for 10 checks, or a 14-day trial of Team or Business. No card needed.`,
  path: href.signup,
});

export default function SignupPage() {
  return <SignupView />;
}
