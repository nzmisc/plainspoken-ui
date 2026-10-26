import { DescriptionItem, DescriptionList } from "@/registry/plainspoken/ui/description-list";

/** layout="stacked" puts each term above its description; divided rules the pairs off. Written with DescriptionItem children. */
export default function DescriptionListStacked() {
  return (
    <DescriptionList layout="stacked" divided className="max-w-sm">
      <DescriptionItem term="Display name">Ana</DescriptionItem>
      <DescriptionItem term="Email">ana@example.com</DescriptionItem>
      <DescriptionItem term="Time zone">Europe/Berlin (UTC+1)</DescriptionItem>
      <DescriptionItem term="Member since">2 March 2026</DescriptionItem>
    </DescriptionList>
  );
}
