import { PageHeader, SocialBottomNav, SocialSidebar } from "@/registry/plainspoken/blocks/social/nav";

/** The nav full width and as a rail of icons, a page's sticky header, and the phone's bottom bar. */
export default function SocialNavDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <SocialSidebar className="h-[420px] border" />
      <SocialSidebar rail className="h-[420px] border" />
      <div className="flex w-80 flex-col gap-4">
        <PageHeader title="Kwame Asante" subtitle="5 posts" backHref="#" className="static border" />
        <SocialBottomNav className="border" />
      </div>
    </div>
  );
}
