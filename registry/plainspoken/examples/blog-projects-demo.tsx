import { BlogProjects } from "@/registry/plainspoken/blocks/blog/projects";

export default function BlogProjectsDemo() {
  return (
    <BlogProjects
      className="max-w-sm"
      projects={[
        { name: "pgdrain", href: "https://code.example.org/ines/pgdrain", description: "Switches a Postgres primary over with writes paused, not failed.", status: "active", meta: "Go · MIT · 640 stars" },
        { name: "unitctl", href: "https://code.example.org/ines/unitctl", description: "Generates systemd units from a small TOML file.", status: "maintained", meta: "Go · MIT" },
        { name: "tidewatch", href: "https://code.example.org/ines/tidewatch", description: "A tide-table scraper for the Adriatic.", status: "archived", meta: "Python · 2019–2022" },
      ]}
    />
  );
}
