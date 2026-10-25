"use client";

import { useState } from "react";
import { countViews, GRID_VIEWS, GridViews } from "@/registry/plainspoken/blocks/grid/views";

const COUNTS = countViews(GRID_VIEWS);

/** The shop's three views with their row counts. Click one to make it current. */
export default function GridViewsDemo() {
  const [active, setActive] = useState("all");
  return <GridViews views={GRID_VIEWS} activeId={active} counts={COUNTS} onSelect={setActive} />;
}
