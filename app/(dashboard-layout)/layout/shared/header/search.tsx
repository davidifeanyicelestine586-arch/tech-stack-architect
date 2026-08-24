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
      const currentPath = parentPath
        ? `${parentPath} → ${item.name}`
        : item.name;

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

      if (item.items) {
        results = [...results, ...searchItems(item.items, q, currentPath)];
      }
    });

    return results;
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems(SidebarContent, query);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="flex items-center relative w-full">
        <SearchIcon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search architecture, domains..."
          className="rounded-lg pl-9 text-xs h-8.5 bg-muted/40 border-border focus-visible:bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {Boolean(query) && (
        <div className="absolute w-full bg-card rounded-lg top-10 z-30 start-0 shadow-lg border border-border overflow-hidden">
          <SimpleBar className="max-h-72 p-2 custom-scroll">
            {results.length > 0 ? (
              results.map((item, i) => (
                <Link
                  key={i}
                  href={item.url}
                  onClick={() => setQuery("")}
                  className="p-2 mb-1 last:mb-0 flex items-center gap-2.5 text-xs font-medium rounded-md hover:bg-primary/10 hover:text-primary transition-colors w-full"
                >
                  <div className="p-1 rounded bg-muted text-muted-foreground">
                    <Layers width={14} height={14} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.path}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
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
