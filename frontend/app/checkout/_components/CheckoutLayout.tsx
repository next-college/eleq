"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ShippingAddress } from "@/lib/checkout";

import ShippingForm from "./ShippingForm";
import PaymentMethod from "./PaymentMethod";
import OrderSummary from "./OrderSummary";
import PlaceOrderButton from "./PlaceOrderButton";

export default function CheckoutLayout() {
  const params = useSearchParams();
  const productId = params.get("product") || undefined;

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod] = useState<"card">("card");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 max-w-7xl mx-auto">
      {/* Left */}
      <div className="lg:col-span-2 space-y-6">
        <ShippingForm
          value={shippingAddress}
          onChange={setShippingAddress}
          saveAddress={saveAddress}
          onToggleSaveAddress={setSaveAddress}
        />

        <PaymentMethod />
      </div>

      {/* Right */}
      <div className="space-y-4">
        <OrderSummary productId={productId} />
        <PlaceOrderButton
          shippingAddress={shippingAddress}
          saveAddress={saveAddress}
          paymentMethod={paymentMethod}
          productId={productId}
        />
      </div>
    </div>
  );
}
