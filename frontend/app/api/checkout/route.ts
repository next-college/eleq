import { NextRequest } from "next/server";
import prisma from "@/prisma/connection";
import { requireAuth } from "@/lib/auth";
import { isError, getErrorMessage } from "@/lib/error-helpers";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  generateOrderNumber,
  calculateOrderTotals,
  validateAddress,
} from "@/lib/order-helper";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      shippingAddress,
      paymentMethod = "card",
      saveAddress = false,
      productId, // For direct buy
      quantity = 1, // For direct buy
    } = body;

    // Validate shipping address
    const addressValidation = validateAddress(shippingAddress);
    if (!addressValidation.valid) {
      return errorResponse(
        `${addressValidation.field} is required in shipping address`,
        400
      );
    }

    // Determine checkout type: cart or direct buy
    const orderItems: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
    }> = [];

    if (productId) {
      // Direct buy flow
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          status: true,
        },
      });

      if (!product) {
        return errorResponse("Product not found", 404);
      }

      if (product.status !== "ACTIVE") {
        return errorResponse("Product not available", 400);
      }

      if (product.stock < quantity) {
        return errorResponse("Insufficient stock", 400);
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
      });
    } else {
      // Cart checkout flow
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              status: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        return errorResponse("Cart is empty", 400);
      }

      // Validate all items
      for (const item of cartItems) {
        if (item.product.status !== "ACTIVE") {
          return errorResponse(
            `${item.product.name} is no longer available`,
            400
          );
        }

        if (item.product.stock < item.quantity) {
          return errorResponse(
            `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available`,
            400
          );
        }

        orderItems.push({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        });
      }
    }

    // Calculate totals
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totals = calculateOrderTotals(subtotal);

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal: totals.subtotal,
          tax: totals.tax,
          shippingCost: totals.shippingCost,
          total: totals.total,
          shippingAddress,
          paymentMethod,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      // Create order items and update stock
      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
          },
        });

        // Decrease product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear cart if checkout from cart
      if (!productId) {
        await tx.cartItem.deleteMany({
          where: { userId: user.id },
        });
      }

      // Save address to user profile if requested
      if (saveAddress) {
        await tx.user.update({
          where: { id: user.id },
          data: { address: shippingAddress },
        });
      }

      return newOrder;
    });

    // Fetch complete order with items
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          select: {
            productName: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    // This is where we will implement payment gateway but for now, let's return a mock payment URL
    const paymentUrl = `https://checkout.stripe.com/pay/${order.id}`;

    return successResponse(
      {
        success: true,
        message: "Order placed successfully",
        order: {
          id: completeOrder!.id,
          orderNumber: completeOrder!.orderNumber,
          items: completeOrder!.items,
          subtotal: completeOrder!.subtotal,
          tax: completeOrder!.tax,
          shippingCost: completeOrder!.shippingCost,
          total: completeOrder!.total,
          status: completeOrder!.status,
          paymentStatus: completeOrder!.paymentStatus,
          createdAt: completeOrder!.createdAt,
        },
        paymentUrl,
      },
      201
    );
  } catch (error: unknown) {
    if (isError(error) && error.message === "Unauthorized") {
      return errorResponse("Not authenticated", 401);
    }
    console.error("Checkout error:", getErrorMessage(error));
    return errorResponse("Failed to process checkout", 500);
  }
}
