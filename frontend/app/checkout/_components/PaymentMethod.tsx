export default function PaymentMethod() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold">Payment Method</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Card payments only. You will be redirected to Stripe after placing your order.
      </p>
    </div>
  );
}
