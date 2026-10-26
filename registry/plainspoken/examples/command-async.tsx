"use client";

import { useEffect, useState } from "react";
import { User } from "@/registry/plainspoken/lib/icons";
import { Command, type CommandItem } from "@/registry/plainspoken/ui/command";

const CUSTOMERS = [
  ["Hannah Lindqvist", "Stockholm"],
  ["Tomás Ferreira", "Porto"],
  ["Priya Raman", "Leeds"],
  ["Ada Okonkwo", "Lisbon"],
  ["Lukas Brandt", "Leipzig"],
  ["Mira Okafor", "Rotterdam"],
  ["Jonas Halvorsen", "Bergen"],
  ["Inés Castillo", "Valencia"],
  ["Kenji Watanabe", "Osaka"],
  ["Hana Novák", "Brno"],
];

/** Pretend server search: 400 ms per request, matching names and cities */
function searchCustomers(q: string): Promise<[string, string][]> {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = CUSTOMERS.filter(([n, c]) => words.every((w) => `${n} ${c}`.toLowerCase().includes(w))) as [string, string][];
  return new Promise((resolve) => setTimeout(() => resolve(hits), 400));
}

/**
 * Searching somewhere else, such as a server: with filter off the items show as given, loading puts
 * a spinner in the search box, and the empty state says what wasn't found.
 */
export default function CommandAsync() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<{ query: string; hits: [string, string][] }>({ query: "", hits: [] });
  const [picked, setPicked] = useState<string | null>(null);
  const query = search.trim();
  const loading = query !== "" && result.query !== query;

  useEffect(() => {
    if (!query) return;
    let current = true;
    const t = setTimeout(() => searchCustomers(query).then((hits) => current && setResult({ query, hits })), 150);
    return () => {
      current = false;
      clearTimeout(t);
    };
  }, [query]);

  const items: CommandItem[] = query && !loading ? result.hits.map(([name, city]) => ({ label: name, hint: city, icon: User, onSelect: () => setPicked(name) })) : [];
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Command
        label="Customers"
        placeholder="Search customers by name or city…"
        search={search}
        onSearchChange={setSearch}
        filter={false}
        loading={loading}
        empty={query ? undefined : "Type a name or a city."}
        groups={[{ items }]}
      />
      <p className="text-muted-foreground">{picked ? `Opened ${picked}.` : "Try “lis” or “o”."}</p>
    </div>
  );
}
