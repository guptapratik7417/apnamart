"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ALL_ORDER_STATUS_OPTIONS,
  getOrderStatusLabel,
} from "@/lib/order-journey";
import { formatPrice, getOrderStatusColor, getPaymentStatusColor } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

export default function AdminOrdersTable({
  orders,
  readOnly = false,
}: {
  orders: Order[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  async function updateOrder(
    order: Order,
    patch: Partial<Pick<Order, "status" | "payment_status">>
  ) {
    setBusy(true);
    const response = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Order update failed");
      return;
    }

    setSelectedOrder(null);
    router.refresh();
  }

  async function createShiprocketShipment(order: Order) {
    setBusy(true);
    const response = await fetch(`/api/shiprocket/orders/${order.id}/create`, {
      method: "POST",
    });
    setBusy(false);

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      alert(payload.error || "Shiprocket shipment creation failed");
      return;
    }

    setSelectedOrder(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-light)]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium">{order.shipping_name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {order.customer_email}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm">{order.items.length}</td>
                <td className="px-5 py-4 font-semibold">{formatPrice(order.total)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    className="text-sm text-[var(--color-primary)] hover:underline"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-xl font-semibold">
                {selectedOrder.order_number}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-[var(--color-text-secondary)]"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <h3 className="mb-2 font-semibold">Customer</h3>
                <p>{selectedOrder.shipping_name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {selectedOrder.customer_email} · {selectedOrder.shipping_phone}
                </p>
                <p className="mt-2 text-sm">
                  {selectedOrder.shipping_address}, {selectedOrder.shipping_city},{" "}
                  {selectedOrder.shipping_state} {selectedOrder.shipping_pincode}
                </p>
              </section>

              <section>
                <h3 className="mb-2 font-semibold">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={`${item.product_id}-${item.product_name}`} className="flex justify-between gap-4 rounded-lg bg-gray-50 p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-[var(--color-text-secondary)]">
                          Qty {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Order Status</span>
                  <select
                    className="input"
                    value={selectedOrder.status}
                    disabled={busy || readOnly}
                    onChange={(event) =>
                      updateOrder(selectedOrder, {
                        status: event.target.value as OrderStatus,
                      })
                    }
                  >
                    {ALL_ORDER_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Payment Status</span>
                  <select
                    className="input"
                    value={selectedOrder.payment_status}
                    disabled={busy || readOnly}
                    onChange={(event) =>
                      updateOrder(selectedOrder, {
                        payment_status: event.target.value as PaymentStatus,
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </label>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-3 font-semibold">Delivery Integration</h3>
                {selectedOrder.shiprocket_order_id ||
                selectedOrder.shiprocket_shipment_id ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    <p>
                      Shiprocket order:{" "}
                      <span className="font-semibold">
                        {selectedOrder.shiprocket_order_id || "Pending"}
                      </span>
                    </p>
                    <p>
                      Shipment:{" "}
                      <span className="font-semibold">
                        {selectedOrder.shiprocket_shipment_id || "Pending"}
                      </span>
                    </p>
                    {selectedOrder.shiprocket_awb_code && (
                      <p>
                        AWB:{" "}
                        <span className="font-semibold">
                          {selectedOrder.shiprocket_awb_code}
                        </span>
                      </p>
                    )}
                    {selectedOrder.shiprocket_courier_name && (
                      <p>
                        Courier:{" "}
                        <span className="font-semibold">
                          {selectedOrder.shiprocket_courier_name}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy || readOnly}
                    className="btn-primary disabled:opacity-60"
                    onClick={() => createShiprocketShipment(selectedOrder)}
                  >
                    Create Shiprocket Shipment
                  </button>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
