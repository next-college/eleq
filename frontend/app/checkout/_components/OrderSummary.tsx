"use client";

type Props = {
  productId?: string;
};

export default function OrderSummary({ productId }: Props) {
  // Data fetching intentionally omitted here
  // This component is DISPLAY ONLY

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold">Order Summary</h2>

      <div className="text-sm text-muted-foreground">
        {productId ? "Buying a single item" : "Items from your cart"}
      </div>

      <div className="border-t pt-2 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>—</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>—</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>Calculated at checkout</span>
        </div>
      </div>
    </div>
  );
}
