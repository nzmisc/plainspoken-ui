"use client";

import { useState } from "react";
import { Search } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Navbar, type NavbarLink } from "@/registry/plainspoken/ui/navbar";

const LINKS: NavbarLink[] = [
  { key: "guides", label: "Guides", href: "#guides" },
  { key: "api", label: "API reference", href: "#api" },
  { key: "changelog", label: "Changelog", href: "#changelog" },
  { key: "pricing", label: "Pricing", href: "#pricing" },
];

export default function NavbarDemo() {
  const [page, setPage] = useState("guides");
  return (
    <Navbar
      brand="Northwind"
      brandHref="#home"
      links={LINKS}
      current={page}
      onNavigate={setPage}
      actions={
        <>
          <Input type="search" prefix={Search} placeholder="Search the docs" aria-label="Search the docs" className="w-48" />
          <Button variant="primary">Sign in</Button>
        </>
      }
    />
  );
}
