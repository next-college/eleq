import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/connection";
import { Prisma, ProductStatus } from "@/lib/generated/prisma";

// Prisma Error Codes Reference:
// P2002 - Unique constraint violation (slug or sku already exists)
// P2025 - Record not found (for update/delete operations)
// P2003 - Foreign key constraint violation (invalid categoryId)
// P2023 - Inconsistent column data (invalid ObjectId format)

// List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const status = searchParams.get("status") as ProductStatus | null;
    const tag = searchParams.get("tag");

    // Sort
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: {
      categoryId?: string;
      brand?: string;
      price?: { gte?: number; lte?: number };
      featured?: boolean;
      status?: ProductStatus;
      tags?: { has: string };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (category) where.categoryId = category;
    if (brand) where.brand = brand;
    if (featured === "true") where.featured = true;
    if (status) where.status = status;
    if (tag) where.tags = { has: tag };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch products and count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      imageUrl,
      categoryId,
      brand,
      stock = 0,
      sku,
      specs,
      tags = [],
      featured = false,
      status = "ACTIVE",
    } = body;

    // Validate required fields
    if (!name || !slug || !description || !price || !imageUrl || !categoryId || !brand) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, description, price, imageUrl, categoryId, brand" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    // Check category exists
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        imageUrl,
        categoryId,
        brand,
        stock,
        sku,
        specs,
        tags,
        featured,
        status,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("slug")) {
          return NextResponse.json(
            { error: "Slug already exists", code: "P2002" },
            { status: 409 }
          );
        }
        if (target.includes("sku")) {
          return NextResponse.json(
            { error: "SKU already exists", code: "P2002" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "Duplicate field value", code: "P2002" },
          { status: 409 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Invalid category reference", code: "P2003" },
          { status: 400 }
        );
      }
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
