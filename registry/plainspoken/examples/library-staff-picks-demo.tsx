import { LibraryStaffPicks } from "@/registry/plainspoken/blocks/library/staff-picks";

/** Two picks, each with the librarian's own words and where they work. */
export default function LibraryStaffPicksDemo() {
  return (
    <LibraryStaffPicks
      basePath="/demos/library"
      picks={[
        {
          book: { id: "braiding-sweetgrass", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", year: 2013, formats: ["book"] },
          by: "Tom Abernathy",
          branch: "Oak Hill Branch",
          note: "Our seed library regulars keep asking for it. Gentle, clear, and it changes how you look at a garden.",
        },
        {
          book: { id: "the-wild-robot", title: "The Wild Robot", author: "Peter Brown", year: 2016, formats: ["book"] },
          by: "Jonah Feld",
          branch: "Riverside Branch",
          note: "Short chapters, big heart. Perfect for reading aloud at bedtime, one or two a night.",
        },
      ]}
    />
  );
}
