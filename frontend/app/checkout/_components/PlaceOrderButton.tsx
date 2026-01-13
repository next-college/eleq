"use client";

import { Button } from "@/components/ui/button";
import { usePlaceOrder } from "../_hooks/use-place-order";
import { ShippingAddress } from "@/lib/checkout";

type Props = {
  shippingAddress: ShippingAddress;
  saveAddress: boolean;
  paymentMethod: "card";
  productId?: string;
};

export default function PlaceOrderButton({
  shippingAddress,
  saveAddress,
  paymentMethod,
  productId,
}: Props) {
  const { placeOrder, loading, error } = usePlaceOrder();

  const handleClick = () => {
    placeOrder({
      shippingAddress,
      saveAddress,
      paymentMethod,
      ...(productId && { productId, quantity: 1 }),
    });
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Placing order..." : "Place Order"}
      </Button>
    </div>
  );
}
