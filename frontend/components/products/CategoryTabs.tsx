"use client";

import type { Category } from "@/lib/products";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1 sm:gap-2 min-w-max">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-200",
            activeCategory === null
              ? "bg-foreground text-background"
              : "hover:bg-muted"
          )}
          onClick={() => onCategoryChange(null)}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-200",
              activeCategory === category.id
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
