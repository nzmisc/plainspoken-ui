"use client";

import { useState } from "react";
import { GRID_VIEWS, GridViews, type GridView } from "@/registry/plainspoken/blocks/grid/views";

/**
 * The table was changed after choosing "Late": the view says "edited" and offers Revert and Save
 * as view. Saved views get a × to delete them.
 */
export default function GridViewsEdited() {
  const [views, setViews] = useState<GridView[]>([...GRID_VIEWS, { ...GRID_VIEWS[1], id: "late-northpost", name: "Late with Northpost", custom: true }]);
  const [active, setActive] = useState("late");
  return (
    <GridViews
      views={views}
      activeId={active}
      edited={active === "late"}
      onSelect={setActive}
      onRevert={() => setActive("late")}
      onSave={(name) => setViews((vs) => [...vs, { ...GRID_VIEWS[1], id: name, name, custom: true }])}
      onDelete={(id) => setViews((vs) => vs.filter((v) => v.id !== id))}
    />
  );
}
