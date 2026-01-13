"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { SortOption } from "@/lib/products";
import { SORT_OPTIONS } from "@/lib/products";
import { cn } from "@/lib/utils";

interface SortDropdownProps {
  value: SortOption;
  onChange: (sortBy: "price" | "createdAt", sortOrder: "asc" | "desc") => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: SortOption) => {
    onChange(option.sortBy, option.sortOrder);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full",
          "border border-border bg-background hover:bg-muted transition-colors"
        )}
      >
        <span>{value.label}</span>
        <ChevronDown className={cn(
          "size-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-background border border-border rounded-xl shadow-lg z-50">
          {SORT_OPTIONS.map((option) => (
            <button
              key={`${option.sortBy}-${option.sortOrder}`}
              onClick={() => handleSelect(option)}
              className={cn(
                "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                value.sortBy === option.sortBy && value.sortOrder === option.sortOrder && "font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
