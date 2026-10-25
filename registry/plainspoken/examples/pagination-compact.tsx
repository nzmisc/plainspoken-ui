"use client";

import { useState } from "react";
import { Pagination } from "@/registry/plainspoken/ui/pagination";

/** compact: just ‹ 3 / 14 ›, for a panel's title bar or a narrow column. */
export default function PaginationCompact() {
  const [page, setPage] = useState(3);
  return <Pagination compact page={page} pageCount={14} onChange={setPage} />;
}
