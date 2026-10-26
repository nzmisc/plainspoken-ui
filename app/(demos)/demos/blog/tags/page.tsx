import { AUTHOR, href } from "@/content/blog/site";
import { pageMetadata } from "../_lib/meta";
import { TagsView } from "../_views";

export const metadata = pageMetadata({
  title: "Tags",
  description: `Every tag on ${AUTHOR.name}'s site, with how many posts carry it.`,
  path: href.tags,
});

export default function TagsPage() {
  return <TagsView />;
}
