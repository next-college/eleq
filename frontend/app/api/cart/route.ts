import { NextRequest } from "next/server";
import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/prisma/connection";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isError, getErrorMessage } from "@/lib/error-helpers";

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        slug: true;
        price: true;
        imageUrl: true;
        stock: true;
        status: true;
      };
    };
  };
}>;

// Define the type for mapped items
interface CartItemMapped {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    stock: number;
    status: string;
  };
  quantity: number;
  subtotal: number;
}

// GET /api/cart - Get current user's cart
export async function GET() {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Fetch cart items with product details
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            stock: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate total
    const items: CartItemMapped[] = cartItems.map(
      (item: CartItemWithProduct) => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })
    );

    const subtotal = items.reduce(
      (sum: number, item: CartItemMapped) => sum + item.subtotal,
      0
    );
    const itemCount = items.reduce(
      (sum: number, item: CartItemMapped) => sum + item.quantity,
      0
    );

    return successResponse({
      cart: {
        items,
        itemCount,
        subtotal,
      },
    });
  } catch (error: unknown) {
    if (isError(error) && error.message === "Unauthorized") {
      return errorResponse("Not authenticated", 401);
    }
    console.error("Get cart error:", getErrorMessage(error));
    return errorResponse("Failed to fetch cart", 500);
  }
}
// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // Validate input
    if (!productId) {
      return errorResponse("Product ID is required", 400);
    }

    if (quantity < 1 || quantity > 99) {
      return errorResponse("Invalid quantity", 400);
    }

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        status: true,
        stock: true,
      },
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    if (product.status !== "ACTIVE") {
      return errorResponse("Product not available", 400);
    }

    if (product.stock < quantity) {
      return errorResponse(
        `Only ${product.stock} items available in stock`,
        400
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return errorResponse(
          `Cannot add more. Only ${product.stock} items available`,
          400
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: productId,
          quantity: quantity,
        },
      });
    }

    return successResponse(
      {
        success: true,
        message: existingCartItem
          ? "Cart updated successfully"
          : "Item added to cart",
        cartItem: {
          id: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
        },
      },
      201
    );
  } catch (error: unknown) {
    if (isError(error) && error.message === "Unauthorized") {
      return errorResponse("Not authenticated", 401);
    }
    console.error("Add to cart error:", error);
    return errorResponse("Failed to add item to cart", 500);
  }
}
