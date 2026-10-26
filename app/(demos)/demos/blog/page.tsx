import { AUTHOR, href } from "@/content/blog/site";
import { JsonLd, PERSON_LD, absolute, pageMetadata } from "./_lib/meta";
import { HomeView } from "./_views";

export const metadata = pageMetadata({
  title: `${AUTHOR.name}: databases, deploys and plain web pages`,
  description: `The personal site of ${AUTHOR.name}, a backend and infrastructure engineer in Ljubljana. ${AUTHOR.tagline}`,
  path: href.home,
  absolute: true,
});

export default function BlogHome() {
  return (
    <>
      <JsonLd data={{ "@type": "WebSite", name: AUTHOR.name, url: absolute(href.home), author: PERSON_LD }} />
      <HomeView />
    </>
  );
}
