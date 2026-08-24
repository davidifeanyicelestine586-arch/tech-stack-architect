"use client";

import React from "react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { ComponentCard } from "./component-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Filter,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

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

  const hasActiveFilters =
    selectedCategory !== "all" ||
    difficultyFilter !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card/50">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${filteredComponents.length} components, categories, or outputs...`}
            className="pl-9 pr-8 h-9 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Chips */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="h-9 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Header Info Line */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {activeDomainObj ? activeDomainObj.title : "All Technology Components"}
          </span>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {filteredComponents.length} available
          </Badge>
        </div>

        {selectedComponentIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {selectedComponentIds.length} in stack
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Component Grid */}
      {filteredComponents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredComponents.map((comp) => (
            <ComponentCard key={comp.id} component={comp} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/30">
          <div className="p-3 rounded-full bg-muted/60 mb-3">
            <Filter className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            No components match your criteria
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search query, clearing category filters, or switching engineering tracks.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="mt-4 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </Button>
        </div>
      )}
    </div>
  );
}
