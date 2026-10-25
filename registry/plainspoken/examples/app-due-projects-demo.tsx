import { AppDueProjects } from "@/registry/plainspoken/blocks/app/due-projects";

/** The next five open projects; due within two weeks is amber. */
export default function AppDueProjectsDemo() {
  return <AppDueProjects className="max-w-sm" />;
}
