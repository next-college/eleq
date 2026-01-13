"use client";

import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onQuickView: (product: Product) => void;
}

export function ProductGrid({ products, isLoading, onQuickView }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted-foreground mb-2">No products found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] bg-muted rounded-xl mb-4" />
      <div className="space-y-2 px-1">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}
