import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/prisma/connection";

// Prisma Error Codes Reference:
// P2002 - Unique constraint violation (slug or sku already exists)
// P2025 - Record not found (for update/delete operations)
// P2003 - Foreign key constraint violation (invalid categoryId)
// P2023 - Inconsistent column data (invalid ObjectId format)
// P2014 - Required relation violation

type Params = { params: Promise<{ id: string }> };

// Get single product
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          include: { user: { select: { id: true, fullName: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate avg rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    return NextResponse.json({
      product: { ...product, avgRating, reviewCount: product.reviews.length },
    });
  } catch (error) {
    console.error("Get product error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2023 - Invalid ObjectId format
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid product ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// Update product
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: body.slug } });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    // Check SKU uniqueness if changing
    if (body.sku && body.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (skuExists) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
    }

    // Check category if changing
    if (body.categoryId && body.categoryId !== existing.categoryId) {
      const catExists = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!catExists) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: body,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);

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
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Product not found", code: "P2025" },
          { status: 404 }
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

    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// Delete product
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product has orders (prevent deletion)
    const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });
    if (hasOrders) {
      return NextResponse.json(
        { error: "Cannot delete product with existing orders. Set status to DISCONTINUED instead" },
        { status: 400 }
      );
    }

    // Delete related cart items first
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Product not found", code: "P2025" },
          { status: 404 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Cannot delete product with related records", code: "P2003" },
          { status: 400 }
        );
      }
      if (error.code === "P2014") {
        return NextResponse.json(
          { error: "Cannot delete product due to related order items", code: "P2014" },
          { status: 400 }
        );
      }
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid product ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
