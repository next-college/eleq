import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/prisma/connection";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Prisma Error Codes Reference:
// P2002 - Unique constraint violation (user already reviewed this product)
// P2025 - Record not found (for update/delete operations)
// P2003 - Foreign key constraint violation (invalid productId/userId)
// P2023 - Inconsistent column data (invalid ObjectId format)

// Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required: productId
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Sort options
    const sort = searchParams.get("sort") || "-createdAt";
    let orderBy: Prisma.ReviewOrderByWithRelationInput;

    switch (sort) {
      case "rating":
        orderBy = { rating: "asc" };
        break;
      case "-rating":
        orderBy = { rating: "desc" };
        break;
      case "createdAt":
        orderBy = { createdAt: "asc" };
        break;
      case "-createdAt":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Verify product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!productExists) {
      return NextResponse.json(
        { error: "Product not found", code: "P2025" },
        { status: 404 }
      );
    }

    // Fetch reviews, count, and rating distribution
    const [reviews, total, ratingAgg] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: { fullName: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    // Calculate average rating
    const avgResult = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    // Build rating distribution
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    ratingAgg.forEach((r) => {
      distribution[r.rating.toString()] = r._count.rating;
    });

    // Transform reviews to hide full names (show only first name + initial)
    const transformedReviews = reviews.map((review) => {
      const nameParts = review.user.fullName.split(" ");
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : nameParts[0];

      return {
        id: review.id,
        user: { fullName: displayName },
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        createdAt: review.createdAt,
      };
    });

    return NextResponse.json({
      reviews: transformedReviews,
      summary: {
        average: avgResult._avg.rating ? Math.round(avgResult._avg.rating * 10) / 10 : 0,
        count: total,
        distribution,
      },
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid product ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// Create a review for a product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, title, comment } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    // Verify product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!productExists) {
      return NextResponse.json(
        { error: "Product not found", code: "P2025" },
        { status: 404 }
      );
    }

    // Check if user has purchased this product (for verified badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING"] },
        },
      },
      select: { id: true },
    });

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        verified: !!hasPurchased,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted",
        review: {
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          verified: review.verified,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "You have already reviewed this product", code: "P2002" },
          { status: 409 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Invalid product or user reference", code: "P2003" },
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

    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
