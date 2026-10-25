import { FAQ, PLANS, PRODUCT, href } from "@/content/landing/content";
import { faqJsonLd } from "@/registry/plainspoken/blocks/landing/faq";
import { JsonLd, absolute, pageMetadata } from "./_lib/meta";
import { HomeView } from "./_views";

export const metadata = pageMetadata({
  title: `${PRODUCT.name}: ${PRODUCT.tagline}`,
  description: PRODUCT.description,
  path: href.home,
  absolute: true,
});

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: PRODUCT.name,
          description: PRODUCT.description,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          url: absolute(href.home),
          offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly, priceCurrency: "USD" })),
          publisher: { "@type": "Organization", name: PRODUCT.name, email: PRODUCT.email, url: absolute(href.home) },
        }}
      />
      <JsonLd data={faqJsonLd(FAQ)} />
      <HomeView />
    </>
  );
}
