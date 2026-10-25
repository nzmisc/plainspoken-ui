import { LandingFaq } from "@/registry/plainspoken/blocks/landing/faq";

/** Native details elements: no script, and find-in-page opens the matching answer. faqJsonLd() turns the same list into FAQPage data. */
export default function LandingFaqDemo() {
  return (
    <LandingFaq
      defaultOpen={["free"]}
      questions={[
        { id: "free", q: "Is the Hobby plan really free?", a: "Yes, for as long as you like. We don't ask for a card." },
        { id: "yearly", q: "What do I save by paying yearly?", a: "Two months: Team is $240 a year instead of $288." },
        { id: "cancel", q: "How do I cancel?", a: "Delete your account from the settings page. It takes effect at once.\n\nWe delete your data within 30 days." },
      ]}
    />
  );
}
