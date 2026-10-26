import { LibraryResultsBar } from "@/registry/plainspoken/blocks/library/results-bar";

/** The count, the filters in force as chips (remove one, or all), and the sort order. */
export default function LibraryResultsBarDemo() {
  return <LibraryResultsBar total={64} from={21} to={40} query="ocean" filters={["Format: Book", "Audience: Teen", "Available now"]} />;
}
