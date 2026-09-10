"use client";

import { useState, useMemo } from "react";
import { Search as SearchIcon, Layers } from "lucide-react";
import SimpleBar from "simplebar-react";
import SidebarContent from "../../vertical/sidebar/sidebaritems";
import Link from "next/link";
import { Input } from "@/components/ui/input";

function Search() {
  const [query, setQuery] = useState("");

  const searchItems = (items: any[], q: string, parentPath = "") => {
    let results: any[] = [];

    items.forEach((item) => {
      const currentPath = parentPath ? `${parentPath} → ${item.name}` : item.name;

      if (
        item.name &&
        item.url &&
        item.name.toLowerCase().includes(q.toLowerCase())
      ) {
        results.push({
          name: item.name,
          url: item.url,
          path: currentPath,
          icon: item.icon,
        });
      }

      if (item.items) results = [...results, ...searchItems(item.items, q, currentPath)];
    });

    return results;
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems(SidebarContent, query);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative flex w-full items-center">
        <SearchIcon
          aria-hidden="true"
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search workspace navigation"
          aria-controls="workspace-search-results"
          placeholder="Search architecture, domains..."
          className="h-8.5 rounded-lg border-border bg-muted/40 pl-9 text-xs focus-visible:bg-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {Boolean(query) && (
        <div
          id="workspace-search-results"
          role="listbox"
          aria-label="Workspace search results"
          className="absolute start-0 top-10 z-30 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <SimpleBar className="custom-scroll max-h-72 p-2">
            {results.length > 0 ? (
              results.map((item, i) => (
                <Link
                  key={i}
                  href={item.url}
                  role="option"
                  aria-label={`Open ${item.name}`}
                  onClick={() => setQuery("")}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-md p-2 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-primary last:mb-0"
                >
                  <div className="rounded bg-muted p-1 text-muted-foreground" aria-hidden="true">
                    <Layers width={14} height={14} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">{item.path}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground" role="status">
                No matching architectural nodes found.
              </div>
            )}
          </SimpleBar>
        </div>
      )}
    </div>
  );
}

export default Search;
