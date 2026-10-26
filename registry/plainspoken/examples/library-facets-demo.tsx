import { LibraryFacets } from "@/registry/plainspoken/blocks/library/facets";

/** Facets with counts; Subject folds its long tail behind “Show more”. Narrow the window to see them move into a drawer. */
export default function LibraryFacetsDemo() {
  return (
    <LibraryFacets
      className="max-w-xs"
      years={{ min: 1813, max: 2025 }}
      branches={[
        { id: "central", name: "Central Library" },
        { id: "riverside", name: "Riverside Branch" },
      ]}
      defaultSelected={{ format: ["Book"] }}
      groups={[
        {
          key: "format",
          label: "Format",
          options: [
            { value: "Book", label: "Book", count: 48 },
            { value: "E-book", label: "E-book", count: 41 },
            { value: "Audiobook", label: "Audiobook", count: 27 },
            { value: "DVD", label: "DVD", count: 6 },
          ],
        },
        {
          key: "subject",
          label: "Subject",
          options: ["Literary fiction", "Classics", "Historical fiction", "Science fiction", "Fantasy", "Mystery", "Nature", "Poetry", "Travel"].map((s, i) => ({
            value: s,
            label: s,
            count: 30 - i * 3,
          })),
        },
        {
          key: "audience",
          label: "Audience",
          options: [
            { value: "Adult", label: "Adult", count: 40 },
            { value: "Teen", label: "Teen", count: 9 },
            { value: "Children", label: "Children", count: 5 },
          ],
        },
      ]}
    />
  );
}
