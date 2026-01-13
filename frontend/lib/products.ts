// Product types for the catalogue page

export type ProductStatus = "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  imageUrl: string;
  categoryId: string;
  brand: string;
  stock: number;
  sku: string | null;
  specs: Record<string, unknown> | null;
  tags: string[];
  featured: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  productCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductFilters {
  category: string | null;
  search: string;
  sortBy: "price" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface SortOption {
  label: string;
  sortBy: "price" | "createdAt";
  sortOrder: "asc" | "desc";
}

export const SORT_OPTIONS: SortOption[] = [
  { label: "Newest Arrivals", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
  { label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
];

export const DEFAULT_FILTERS: ProductFilters = {
  category: null,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};
