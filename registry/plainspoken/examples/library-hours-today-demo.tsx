import { LibraryHoursToday } from "@/registry/plainspoken/blocks/library/hours-today";
import type { Branch } from "@/registry/plainspoken/blocks/library/lib";

const BRANCHES: Branch[] = [
  { id: "central", name: "Central Library", address: "200 Market Street", phone: "(555) 014-2200", hours: [["13:00", "17:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "18:00"], ["10:00", "17:00"]] },
  { id: "riverside", name: "Riverside Branch", address: "41 Mill Road", phone: "(555) 014-2310", hours: [null, ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "17:00"], ["10:00", "14:00"]] },
  { id: "northgate", name: "Northgate Branch", address: "1580 Northgate Avenue", phone: "(555) 014-2420", hours: [null, null, ["11:00", "19:00"], ["11:00", "19:00"], ["11:00", "19:00"], ["11:00", "19:00"], ["10:00", "16:00"]] },
  { id: "oak-hill", name: "Oak Hill Branch", address: "9 Chestnut Lane", phone: "(555) 014-2530", hours: [null, null, ["12:00", "20:00"], ["10:00", "17:00"], ["12:00", "20:00"], ["10:00", "17:00"], ["10:00", "17:00"]] },
];

/** A Sunday: two branches keep Sunday hours, and one is shut for repairs on top of that. */
export default function LibraryHoursTodayDemo() {
  return <LibraryHoursToday branches={BRANCHES} date="2026-10-25" closed={{ "oak-hill": "Floor refinishing" }} className="max-w-sm" />;
}
