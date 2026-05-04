"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOrderJourneySteps,
  getOrderStatusLabel,
} from "@/lib/order-journey";
import { formatPrice, getOrderStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

function findLocalOrder(orderId: string) {
  try {
    const raw = window.localStorage.getItem("apnamart_orders");
    const orders = raw ? (JSON.parse(raw) as Order[]) : [];
    return orders.find((order) => order.id === orderId) || null;
  } catch {
    return null;
  }
}

export default function OrderSuccessView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const localOrder = findLocalOrder(orderId);
      if (localOrder) {
        setOrder(localOrder);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const payload = (await response.json()) as { order?: Order };
        setOrder(payload.order || null);
      }
      setLoading(false);
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container-custom flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <Link href="/products" className="btn-primary mt-6 inline-flex">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const journeySteps = getOrderJourneySteps(order.status);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>
            <h1 className="font-serif text-4xl font-bold">
              Order Placed Successfully
            </h1>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Order {order.order_number} is saved. We will contact{" "}
              {order.shipping_phone} for confirmation.
            </p>
          </div>

          <section className="rounded-lg bg-white shadow-sm">
            <div className="border-b border-[var(--color-border-light)] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Customer
                  </p>
                  <p className="font-semibold">{order.shipping_name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {order.customer_email}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusColor(order.status)}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {journeySteps.map((step) => {
                  const isDone = step.state === "complete";
                  const isCurrent = step.state === "current";
                  const isCancelled = step.state === "cancelled";

                  return (
                    <div key={step.value} className="min-w-0">
                      <div
                        className={`h-1.5 rounded-full ${
                          isDone || isCurrent
                            ? "bg-[var(--color-primary)]"
                            : isCancelled
                              ? "bg-red-200"
                              : "bg-gray-200"
                        }`}
                      />
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          isCurrent
                            ? "text-[var(--color-primary)]"
                            : isCancelled
                              ? "text-red-700"
                              : "text-[var(--color-text-primary)]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <h2 className="mb-4 font-semibold">Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.product_name}`}
                    className="flex justify-between gap-4 text-sm"
                  >
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

              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Shipping</span>
                  <span>
                    {order.shipping_charge === 0
                      ? "Free"
                      : formatPrice(order.shipping_charge)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-[var(--color-primary)]">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/products" className="btn-primary text-center">
              Continue Shopping
            </Link>
            <Link href="/orders" className="btn-outline text-center">
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
