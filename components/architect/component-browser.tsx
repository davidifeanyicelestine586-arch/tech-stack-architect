"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { ComponentCard } from "./component-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, RotateCcw, CheckCircle2 } from "lucide-react";

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
    clearSelection,
  } = useTechStack();

  const activeDomainObj = domains.find((d) => d.id === activeDomain);
  const resetFilters = () => {
    setSelectedCategory("all");
    setDifficultyFilter("all");
    setSearchQuery("");
  };
  const hasActiveFilters = selectedCategory !== "all" || difficultyFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card/50 p-3.5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${filteredComponents.length} technologies...`}
            aria-label="Search technologies"
            className="h-11 bg-background pl-9 pr-10 text-sm"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear technology search" className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="technology-category">Category</label>
          <select id="technology-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <label className="sr-only" htmlFor="technology-difficulty">Experience level</label>
          <select id="technology-difficulty" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="all">All Experience Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={resetFilters} className="h-11 gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="size-3.5" /> Reset</Button>}
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{activeDomainObj ? activeDomainObj.title : "All Technologies"}</span>
          <Badge variant="secondary" className="text-[10px] font-mono">{filteredComponents.length} available</Badge>
        </div>
        {selectedComponentIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-primary"><CheckCircle2 className="size-3.5" /> {selectedComponentIds.length} in stack</span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-11 px-3 text-xs text-muted-foreground hover:text-destructive">Clear</Button>
          </div>
        )}
      </div>

      {filteredComponents.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((comp) => <ComponentCard key={comp.id} component={comp} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
          <div className="mb-3 rounded-full bg-muted/60 p-3"><Filter className="size-6 text-muted-foreground" /></div>
          <h3 className="text-sm font-semibold text-foreground">No technologies match your criteria</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Try adjusting your search or filters, or switch project types.</p>
          <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 h-11 gap-1.5 text-xs"><RotateCcw className="size-3.5" /> Clear Filters</Button>
        </div>
      )}
    </div>
  );
}
