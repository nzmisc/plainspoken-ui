"use client";

/**
 * next/link's Link, re-exported from a "use client" file so it can be handed to a component as a
 * prop from anywhere: `<Navbar linkAs={NextLink} />`.
 *
 * Why: the navigation components (Navbar, Sidebar, AppShell, Breadcrumb, Pagination) are client
 * components that take the link component as `linkAs`. In a server component, next/link's `Link`
 * is a plain function, and React can't pass functions from server to client components ("Functions
 * cannot be passed directly to Client Components"). Imported from a "use client" module it becomes
 * a client reference instead, which can be passed. In a client component either works.
 *
 *   import { NextLink } from "@/lib/next-link";
 *   <Breadcrumb linkAs={NextLink} items={…} />
 */
export { default as NextLink } from "next/link";
