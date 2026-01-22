"use client";
import Image from "next/image";

import React, { useEffect, useState } from "react";
import {
  Minus,
  Plus,
  Bookmark,
  Truck,
  CreditCard,
  Lock,
  MessageCircle,
  Loader2,
  Trash2,
} from "lucide-react";

interface CartItem {
  id: number;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  creditBack?: number;
  freeShipping: boolean;
  saved: boolean;
}

//Backcend URL
const API_BASE_URL = "http://localhost:3000/api";

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  //Fetch APIs
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/cart`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setCartItems(data);
      } catch (error) {
        console.error("Failed to fetch Cart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  //Update Quantity
  const updateQuantity = async (id: number, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);

    // Update UI immediately
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)),
    );

    try {
      await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // Toggle Save for Later
  const toggleSave = async (id: number): Promise<void> => {
    // 1. Find the item
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    // 2. Update UI Optimistically (Immediate feedback)
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, saved: !i.saved } : i)),
    );

    try {
      await fetch(`${API_BASE_URL}/cart/save/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: !item.saved }),
      });
    } catch (error) {
      console.error("Failed to save item:", error);
    }
  };

  // CHECKOUT
  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: cartItems }),
      });
      const result = await response.json();

      // Handle  success message from backend
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert("Order placed successfully (Local Dev Mode)");
      }
    } catch (error) {
      console.error("Checkout detail:", error);
      alert("Checkout failed. Is your local server running?");
    } finally {
      setIsProcessing(false);
    }
  };

  // DELETE Item from Cart
  const deleteItem = async (id: number) => {
    // 1. Optimistic UI update: Remove from screen immediately
    setCartItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item from server");
    } catch (error) {
      console.error("Delete failed:", error);
      // Optional: Refresh the cart if the server delete failed to bring the item back
      alert("Could not remove item. Please refresh.");
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-[#9A1750]" />
      </div>
    );
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#5D001E] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <h1 className="text-xl font-bold">eleq</h1>
            <nav className="flex gap-6 text-sm">
              <button className="hover:text-gray-300">Laptops</button>
              <button className="hover:text-gray-300">Phones</button>
              <button className="hover:text-gray-300">Accessories</button>
              <button className="hover:text-gray-300">Services</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">My Shopping Cart</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <button
                        onClick={() => toggleSave(item.id)}
                        className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                          item.saved
                            ? "bg-[#9A1750] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Bookmark
                          className="w-3 h-3"
                          fill={item.saved ? "currentColor" : "none"}
                        />
                        {item.saved ? "Saved" : "Save for later"}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.creditBack && (
                      <p className="text-sm text-gray-600 mb-1">
                        Get USD ${item.creditBack.toFixed(2)} Credit Back in
                        Rewards
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mb-3">Free Shipping</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-xl font-bold">
                          USD ${item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-[#9A1750] hover:bg-[#EE4C7C] text-white rounded flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h3 className="text-xl font-bold mb-6">Total Price Details</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">No. of Items</span>
                  <span className="font-semibold">{itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Charges</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Total Amount</span>
                  <span className="font-bold text-xl">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout} // Attach the function
                disabled={isProcessing || cartItems.length === 0} // Prevent double clicks
                className="w-full bg-[#9A1750] hover:bg-[#EE4C7C] text-white py-3 rounded font-semibold mb-4 flex justify-center items-center cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Checkout"
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mb-6">
                Estimated to ship within 1 business day after payment
                confirmation.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-xs text-gray-600">
                    Free shipping on orders over USD $149
                  </p>
                </div>
                <div className="text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-xs text-gray-600">
                    We accept credit cards, PayPal, and bank wires
                  </p>
                </div>
                <div className="text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-xs text-gray-600">
                    Safe and Secure Payments
                  </p>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-xs text-gray-600">
                    Customer Care Live Chat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
