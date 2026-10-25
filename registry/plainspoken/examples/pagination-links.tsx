import { Pagination } from "@/registry/plainspoken/ui/pagination";

/**
 * With href every page is a real link, so a server-rendered list pages without JavaScript and
 * search engines follow the pages. Pass your router's link as linkAs (with Next.js,
 * linkAs={NextLink} from the next-link item). This one is a server component.
 */
export default function PaginationLinks() {
  return <Pagination page={4} pageCount={12} href={(p) => `?page=${p}`} size="md" />;
}
