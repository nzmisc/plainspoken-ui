"use client";

import { useState } from "react";
import { Pagination } from "@/registry/plainspoken/ui/pagination";

/** Previous, numbers, Next, the row range and a rows-per-page picker. Narrow the window: on phones only Previous, Next and "Page 7 of 14" stay. */
export default function PaginationDemo() {
  const [page, setPage] = useState(7);
  const [pageSize, setPageSize] = useState(25);
  const total = 340;
  const pageCount = Math.ceil(total / pageSize);
  return (
    <Pagination
      page={Math.min(page, pageCount)}
      pageCount={pageCount}
      onChange={setPage}
      total={total}
      pageSize={pageSize}
      pageSizes={[10, 25, 50, 100]}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}
