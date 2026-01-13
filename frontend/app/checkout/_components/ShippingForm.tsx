"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShippingAddress } from "@/lib/checkout";

type Props = {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
  saveAddress: boolean;
  onToggleSaveAddress: (v: boolean) => void;
};

export default function ShippingForm({
  value,
  onChange,
  saveAddress,
  onToggleSaveAddress,
}: Props) {
  const update = (field: keyof ShippingAddress, v: string) => {
    onChange({ ...value, [field]: v });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Shipping Address</h2>

      <Input placeholder="Street" value={value.street} onChange={(e) => update("street", e.target.value)} />
      <Input placeholder="City" value={value.city} onChange={(e) => update("city", e.target.value)} />
      <Input placeholder="State" value={value.state} onChange={(e) => update("state", e.target.value)} />
      <Input placeholder="Zip Code" value={value.zipCode} onChange={(e) => update("zipCode", e.target.value)} />
      <Input placeholder="Country" value={value.country} onChange={(e) => update("country", e.target.value)} />

      <div className="flex items-center gap-2">
        <Checkbox className="border-2 border-gray-400" checked={saveAddress} onCheckedChange={(v) => onToggleSaveAddress(Boolean(v))} />
        <span className="text-sm">Save this address</span>
      </div>
    </div>
  );
}
