import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OrderStatus, Prisma } from "@/lib/generated/prisma";
import prisma from "@/prisma/connection";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Prisma Error Codes Reference:
// P2002 - Unique constraint violation
// P2025 - Record not found (for update/delete operations)
// P2003 - Foreign key constraint violation
// P2014 - Required relation violation

// List user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Filter by status
    const status = searchParams.get("status") as OrderStatus | null;

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      userId: session.user.id,
    };

    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status;
    }

    // Fetch orders and count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          deliveredAt: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Transform response
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemCount: order._count.items,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
    }));

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
