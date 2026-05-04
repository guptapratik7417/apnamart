"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { appProperties } from "@/config/app-properties";
import {
  clearCart,
  getCartSubtotal,
  getShippingCharge,
} from "@/lib/cart-client";
import { useSiteConfig } from "@/lib/use-site-config";
import { formatPrice } from "@/lib/utils";
import type { CartLine, CreateOrderInput, Order, PaymentMethod } from "@/types";

type RazorpayMethod = "card" | "upi" | "netbanking" | "emi";
type PaymentOptionId = "cod" | RazorpayMethod;
const paymentPageConfig = appProperties.paymentPage;

type PaymentDraft = CreateOrderInput & {
  cart_lines: CartLine[];
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  config?: {
    display?: {
      blocks?: Record<
        string,
        {
          name: string;
          instruments: Array<{ method: RazorpayMethod }>;
        }
      >;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  handler: (response: RazorpayResponse) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const paymentOptions = paymentPageConfig.options;

function saveOrderForSuccess(order: Order) {
  const raw = window.localStorage.getItem(paymentPageConfig.savedOrdersStorageKey);
  const orders = raw ? (JSON.parse(raw) as Order[]) : [];
  const nextOrders = [order, ...orders.filter((item) => item.id !== order.id)];
  window.localStorage.setItem(
    paymentPageConfig.savedOrdersStorageKey,
    JSON.stringify(nextOrders.slice(0, 20))
  );
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = paymentPageConfig.razorpayScriptUrl;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PaymentIcon({ id }: { id: PaymentOptionId }) {
  const option = paymentOptions.find((item) => item.id === id);
  return <span className="text-2xl font-bold">{option?.iconLabel || id}</span>;
}

export default function PaymentView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const config = useSiteConfig();
  const [order, setOrder] = useState<Order | null>(null);
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [selected, setSelected] = useState<PaymentOptionId>("card");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        try {
          const raw = window.localStorage.getItem(paymentPageConfig.draftStorageKey);
          const parsed = raw ? (JSON.parse(raw) as PaymentDraft) : null;
          setDraft(parsed?.items?.length ? parsed : null);
        } catch {
          setDraft(null);
        }
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as { order?: Order };
        setOrder(payload.order || null);
      }
      setLoading(false);
    }

    void loadOrder();
  }, [orderId]);

  async function completeOrder(nextOrder: Order) {
    saveOrderForSuccess(nextOrder);
    window.localStorage.removeItem(paymentPageConfig.draftStorageKey);
    clearCart();
    router.push(`/order-success?orderId=${nextOrder.id}`);
  }

  async function createOrder(paymentMethod: PaymentMethod) {
    if (order) return order;
    if (!draft) throw new Error("Payment details are missing.");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        payment_method: paymentMethod,
      }),
    });
    const payload = (await response.json()) as { order?: Order; error?: string };

    if (!response.ok || !payload.order) {
      throw new Error(payload.error || "Order could not be created.");
    }

    setOrder(payload.order);
    return payload.order;
  }

  async function confirmCod() {
    const nextOrder = await createOrder("cod");

    const response = await fetch("/api/payments/cod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: nextOrder.id }),
    });

    if (!response.ok) {
      throw new Error("COD could not be confirmed.");
    }

    await completeOrder({
      ...nextOrder,
      payment_method: "cod",
      payment_status: "pending",
    });
  }

  async function startRazorpay(method: RazorpayMethod) {
    const nextOrder = await createOrder("razorpay");

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      throw new Error("Could not load Razorpay checkout.");
    }

    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: nextOrder.id, amount: nextOrder.total }),
    });
    const payment = (await response.json()) as {
      error?: string;
      razorpay_order_id?: string;
      key_id?: string;
      amount?: number;
    };

    if (
      !response.ok ||
      !payment.razorpay_order_id ||
      !payment.key_id ||
      !payment.amount
    ) {
      throw new Error(payment.error || "Online payment is not available right now.");
    }

    const checkout = new window.Razorpay({
      key: payment.key_id,
      amount: payment.amount,
      currency: "INR",
      name: config.storeName,
      description: nextOrder.order_number,
      order_id: payment.razorpay_order_id,
      prefill: {
        name: nextOrder.shipping_name || "",
        email: nextOrder.customer_email || "",
        contact: nextOrder.shipping_phone || "",
      },
      config: {
        display: {
          blocks: {
            selected: {
              name: paymentOptions.find((option) => option.id === method)?.label || "Pay online",
              instruments: [{ method }],
            },
          },
          sequence: ["block.selected"],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      handler: async (razorpayResponse) => {
        const verify = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: nextOrder.id,
            ...razorpayResponse,
          }),
        });

        if (verify.ok) {
          await completeOrder({
            ...nextOrder,
            payment_method: "razorpay",
            payment_status: "paid",
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          });
        } else {
          alert("Payment could not be verified. Please contact support.");
        }
      },
    });

    checkout.open();
  }

  async function handlePayment() {
    if (!order && !draft) return;

    setBusy(true);
    try {
      if (selected === "cod") {
        await confirmCod();
      } else {
        await startRazorpay(selected);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="container-custom flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!order && !draft) {
    return (
      <div className="container-custom py-16 text-center">
          <h1 className="text-2xl font-semibold">
            {paymentPageConfig.missingDetailsTitle}
          </h1>
          <Link href="/checkout" className="btn-primary mt-6 inline-flex">
            {paymentPageConfig.backToCheckoutLabel}
        </Link>
      </div>
    );
  }

  const activeDraft = draft as PaymentDraft;
  const summaryItems =
    order?.items.map((item) => ({
      key: `${item.id || item.product_id}-${item.product_name}`,
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      total: item.total,
    })) ||
    activeDraft.cart_lines.map((item) => ({
      key: item.product_id,
      name: item.name,
      image: item.image_url,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));
  const subtotal = order?.subtotal ?? getCartSubtotal(activeDraft.cart_lines);
  const shipping =
    order?.shipping_charge ?? getShippingCharge(subtotal, config.shipping);
  const total = order?.total ?? subtotal + shipping;
  const customerName = order?.shipping_name || activeDraft.shipping_name;

  if (!summaryItems.length) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {paymentPageConfig.missingDetailsTitle}
        </h1>
        <Link href="/checkout" className="btn-primary mt-6 inline-flex">
          {paymentPageConfig.backToCheckoutLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="border-b border-pink-100 bg-[#fff1f6] py-12">
        <div className="container-custom">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Payment
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-[var(--color-text-primary)]">
            {paymentPageConfig.title}
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {paymentPageConfig.subtitle}
          </p>
        </div>
      </section>

      <main className="container-custom grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{paymentPageConfig.optionsTitle}</h2>
          <div className="mt-5 space-y-3">
            {paymentOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                  selected === option.id
                    ? "border-[var(--color-primary)] bg-yellow-50"
                    : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]"
                }`}
                onClick={() => setSelected(option.id)}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    selected === option.id
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-gray-100 text-[var(--color-text-secondary)]"
                  }`}
                >
                  <PaymentIcon id={option.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
                    {option.description}
                  </span>
                </span>
                <span
                  className={`h-5 w-5 rounded-full border ${
                    selected === option.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] ring-2 ring-yellow-100"
                      : "border-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        <aside>
          <div className="rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold">
              {paymentPageConfig.orderSummaryTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {customerName}
            </p>
            <div className="mt-5 max-h-72 space-y-4 overflow-auto">
              {summaryItems.map((item) => (
                <div key={item.key} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Shipping</span>
                <span>
                  {shipping === 0
                    ? "Free"
                    : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-semibold">
                <span>Total</span>
                <span className="text-[var(--color-primary)]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handlePayment}
              className="btn-primary mt-6 w-full disabled:opacity-60"
            >
              {busy
                ? paymentPageConfig.processingLabel
                : selected === "cod"
                  ? paymentPageConfig.confirmCodLabel
                  : `${paymentPageConfig.payWithPrefix} ${paymentOptions.find((option) => option.id === selected)?.label}`}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
