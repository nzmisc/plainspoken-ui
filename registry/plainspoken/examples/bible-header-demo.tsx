import { BibleHeader } from "@/registry/plainspoken/blocks/bible/header";

/** The reader's bar, as on a chapter page: Books is current, and the search box is on the right. Narrow the window for the Menu button. */
export default function BibleHeaderDemo() {
  return <BibleHeader basePath="/demos/bible" pathname="/demos/bible/john/3" />;
}
