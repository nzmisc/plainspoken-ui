import { AUTHOR, href } from "@/content/blog/site";
import { JsonLd, PERSON_LD, absolute, pageMetadata } from "../_lib/meta";
import { AboutView } from "../_views";

export const metadata = pageMetadata({
  title: "About",
  description: `${AUTHOR.name} is a backend and infrastructure engineer in Ljubljana: Postgres, deploy tooling and on-call. Work history, how to get in touch, and how this site is made.`,
  path: href.about,
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={{ "@type": "ProfilePage", url: absolute(href.about), mainEntity: PERSON_LD }} />
      <AboutView />
    </>
  );
}
