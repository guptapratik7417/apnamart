"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderRefundButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function requestRefund() {
    if (!window.confirm("Request refund for this order?")) return;
    setBusy(true);
    const response = await fetch(`/api/orders/${orderId}/refund`, {
      method: "POST",
    });
    setBusy(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Refund request failed");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      className="inline-flex items-center rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-60"
      disabled={busy}
      onClick={requestRefund}
    >
      {busy ? "Requesting..." : "Request Refund"}
    </button>
  );
}
