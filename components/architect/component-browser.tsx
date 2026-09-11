"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { ComponentCard } from "./component-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, RotateCcw, CheckCircle2, SlidersHorizontal, ChevronDown } from "lucide-react";

export function ComponentBrowser() {
  const {
    filteredComponents,
    categories,
    selectedCategory,
    setSelectedCategory,
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    activeDomain,
    domains,
    selectedComponentIds,
  } = useTechStack();

  const activeDomainObj = domains.find((d) => d.id === activeDomain);
  const resetFilters = () => {
    setSelectedCategory("all");
    setDifficultyFilter("all");
    setSearchQuery("");
  };
  const hasActiveFilters = selectedCategory !== "all" || difficultyFilter !== "all" || searchQuery.trim().length > 0;
  const activeFilterCount = Number(selectedCategory !== "all") + Number(difficultyFilter !== "all") + Number(searchQuery.trim().length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card/50 p-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${filteredComponents.length} technologies...`}
              aria-label="Search technologies"
              className="h-11 bg-background pl-9 pr-12 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear technology search"
                className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:scale-[0.98]"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <details className="group md:min-w-44">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-muted [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs font-mono" aria-label={`${activeFilterCount} active filters`}>{activeFilterCount}</Badge>
                )}
              </span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-background/80 p-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="sr-only" htmlFor="technology-category">Category</label>
              <select id="technology-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                <option value="all">All Categories</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <label className="sr-only" htmlFor="technology-difficulty">Experience level</label>
              <select id="technology-difficulty" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                <option value="all">All Experience Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              {hasActiveFilters && <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="h-11 gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-3.5" aria-hidden="true" /> Reset filters</Button>}
            </div>
          </details>
        </div>

        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Browse technologies for your project. Use filters when you need a more specific match.
        </p>
      </div>

      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{activeDomainObj ? activeDomainObj.title : "All Technologies"}</span>
          <Badge variant="secondary" className="text-xs font-mono">{filteredComponents.length} available</Badge>
        </div>
        {selectedComponentIds.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            <span>{selectedComponentIds.length} in your stack</span>
          </span>
        )}
      </div>

      {filteredComponents.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Technology catalog">
          {filteredComponents.map((comp) => <ComponentCard key={comp.id} component={comp} />)}
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
          <div className="mb-3 rounded-full bg-muted/60 p-3"><Filter className="size-6 text-muted-foreground" aria-hidden="true" /></div>
          <h3 className="text-sm font-semibold text-foreground">No technologies match your criteria</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Try adjusting your search or filters, or switch project types.</p>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="mt-4 h-11 gap-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-3.5" aria-hidden="true" /> Clear filters</Button>
        </div>
      )}
    </div>
  );
}
