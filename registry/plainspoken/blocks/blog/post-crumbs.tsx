"use client";

import Link from "next/link";
import { Breadcrumb, type BreadcrumbProps } from "@/registry/plainspoken/ui/breadcrumb";

/**
 * Breadcrumb with next/link, from the client side: a server component can't hand Link to a client
 * component as a prop (Next.js sees a plain function), so the pairing happens here.
 */
export function BlogPostCrumbs(props: Omit<BreadcrumbProps, "linkAs">) {
  return <Breadcrumb {...props} linkAs={Link} />;
}
