import { LandingTestimonials } from "@/registry/plainspoken/blocks/landing/testimonials";

export default function LandingTestimonialsDemo() {
  return (
    <LandingTestimonials
      testimonials={[
        { quote: "In six months we've been paged nine times, and every one was a real outage.", name: "Marta Kos", role: "Platform lead", company: "Northwind Freight" },
        { quote: "During our last outage the support inbox stayed quiet: customers could see we knew.", name: "Daniel Okafor", role: "Head of support", company: "Mosswood Books" },
        { quote: "Heartbeats caught a backup job that had been failing silently for eleven days.", name: "Priya Raman", role: "Solo founder", company: "Pellucid" },
      ]}
    />
  );
}
