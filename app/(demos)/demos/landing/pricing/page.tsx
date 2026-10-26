import { PLANS, PRODUCT, href } from "@/content/landing/content";
import { faqJsonLd } from "@/registry/plainspoken/blocks/landing/faq";
import { JsonLd, absolute, pageMetadata } from "../_lib/meta";
import { BILLING_FAQ, PricingView } from "../_views";

export const metadata = pageMetadata({
  title: "Pricing",
  description: `${PRODUCT.name} is free for 10 checks. Team is $24 a month for 100 checks every 30 seconds with SMS and phone alerts; Business is $79 with SSO and an SLA. Compare every feature.`,
  path: href.pricing,
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: PRODUCT.name,
          description: PRODUCT.description,
          url: absolute(href.pricing),
          offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly, priceCurrency: "USD", url: absolute(`${href.signup}?plan=${p.key}`) })),
        }}
      />
      <JsonLd data={faqJsonLd(BILLING_FAQ)} />
      <PricingView />
    </>
  );
}
