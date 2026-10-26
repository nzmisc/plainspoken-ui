"use client";

import { useState } from "react";
import { ORDERS_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdDiagram } from "@/registry/plainspoken/blocks/erd/diagram";
import { addRelation, connectColumns, updateColumn, updateRelation } from "@/registry/plainspoken/blocks/erd/model";

/**
 * Six tables of the demo shop on a canvas: drag them, hover or select one to bring out its
 * relations, click a line for its details, and drag the square at the end of a row onto another
 * table's key to add a foreign key. Scroll to pan, Ctrl + scroll to zoom.
 */
export default function ErdDiagramDemo() {
  const [model, setModel] = useState(ORDERS_MODEL);
  return (
    <ErdDiagram
      model={model}
      className="h-[28rem] border border-border"
      onRelationEdit={(id, patch) => setModel((m) => updateRelation(m, id, patch))}
      onConnect={(a, b) =>
        setModel((m) => {
          const r = connectColumns(m, a, b);
          if ("error" in r) return m;
          const next = addRelation(m, r.relation);
          return r.retype ? updateColumn(next, r.retype.table, r.retype.column.name, r.retype.column) : next;
        })
      }
    />
  );
}
