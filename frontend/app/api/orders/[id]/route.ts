import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/prisma/connection";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Prisma Error Codes Reference:
// P2002 - Unique constraint violation
// P2025 - Record not found (for update/delete operations)
// P2003 - Foreign key constraint violation
// P2023 - Inconsistent column data (invalid ObjectId format)

type Params = { params: Promise<{ id: string }> };

// Get single order details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found", code: "P2025" },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        total: order.total,
        shippingAddress: order.shippingAddress,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid order ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// Update order status (for admin or cancel by user)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found", code: "P2025" },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Users can only cancel pending orders
    if (body.status === "CANCELLED") {
      if (order.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled" },
          { status: 400 }
        );
      }

      // Cancel the order and restore stock
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Get order items to restore stock
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });

        // Restore stock for each product
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Update order status
        return tx.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
            paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus,
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Order cancelled successfully",
        order: updatedOrder,
      });
    }

    return NextResponse.json(
      { error: "Invalid status update" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update order error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025 - Record not found during update
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Order not found", code: "P2025" },
          { status: 404 }
        );
      }
      // P2023 - Invalid ObjectId format
      if (error.code === "P2023") {
        return NextResponse.json(
          { error: "Invalid order ID format", code: "P2023" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
