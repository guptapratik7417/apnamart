"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appProperties } from "@/config/app-properties";
import {
  getCartSubtotal,
  getShippingCharge,
  useCartLines,
} from "@/lib/cart-client";
import { useSiteConfig } from "@/lib/use-site-config";
import { formatPrice, isValidEmail, isValidPhone } from "@/lib/utils";
import type { User } from "@/types";

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

type PincodeLookupResponse = {
  city?: string;
  state?: string;
  error?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartLines();
  const config = useSiteConfig();
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLookup, setPincodeLookup] = useState<{
    loading: boolean;
    message: string;
    tone: "muted" | "success" | "error";
  }>({
    loading: false,
    message: "",
    tone: "muted",
  });
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const subtotal = getCartSubtotal(items);
  const shipping = getShippingCharge(subtotal, config.shipping);
  const total = subtotal + shipping;

  useEffect(() => {
    async function loadCustomerDetails() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return;

      const payload = (await response.json()) as { user?: User | null };
      const user = payload.user;
      if (!user) {
        router.push("/login?redirect=/checkout");
        return;
      }

      setForm((current) => ({
        ...current,
        name: current.name || user.full_name || "",
        email: current.email || user.email || "",
        phone: current.phone || user.phone || "",
      }));
    }

    void loadCustomerDetails();
  }, [router]);

  useEffect(() => {
    const pincode = form.pincode.trim();

    if (!/^\d{6}$/.test(pincode)) return;

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      setPincodeLookup({
        loading: true,
        message: "Fetching city and state...",
        tone: "muted",
      });

      fetch(`/api/pincode/${pincode}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as PincodeLookupResponse;
          if (!response.ok || !payload.city || !payload.state) {
            throw new Error(payload.error || "Pincode lookup failed.");
          }

          setForm((current) => {
            if (current.pincode.trim() !== pincode) return current;

            return {
              ...current,
              city: payload.city || current.city,
              state: payload.state || current.state,
            };
          });
          setPincodeLookup({
            loading: false,
            message: "City and state filled from pincode.",
            tone: "success",
          });
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setPincodeLookup({
            loading: false,
            message:
              error instanceof Error
                ? error.message
                : "Pincode lookup failed. Please enter city and state manually.",
            tone: "error",
          });
        });
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [form.pincode]);

  function validate() {
    if (!form.name.trim()) return "Name is required.";
    if (!isValidEmail(form.email)) return "Enter a valid email address.";
    if (!isValidPhone(form.phone)) return "Enter a valid 10 digit Indian phone number.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state.trim()) return "State is required.";
    if (!/^\d{6}$/.test(form.pincode)) return "Enter a valid 6 digit pincode.";
    if (items.length === 0) return "Your cart is empty.";
    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSubmitting(true);
    try {
      window.localStorage.setItem(
        appProperties.paymentPage.draftStorageKey,
        JSON.stringify({
          cart_lines: items,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          customer_email: form.email,
          shipping_name: form.name,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_pincode: form.pincode,
          shipping_phone: form.phone,
          notes: form.notes,
        })
      );
      router.push("/payment");
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <div className="container-custom py-16 text-center">
          <h1 className="text-2xl font-semibold">{config.checkout.emptyCartTitle}</h1>
          <Link href="/products" className="btn-primary mt-6 inline-flex">
            {config.checkout.emptyCartCtaLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="border-b border-pink-100 bg-[#fff1f6] py-12">
        <div className="container-custom">
          <h1 className="font-serif text-4xl font-bold text-[var(--color-text-primary)]">
            {config.checkout.title}
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {config.checkout.subtitle}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="container-custom grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{config.checkout.customerDetailsTitle}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                className="input"
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <input
                className="input"
                placeholder="Pincode"
                value={form.pincode}
                onChange={(event) => {
                  const pincode = event.target.value.replace(/\D/g, "");
                  setForm({
                    ...form,
                    pincode,
                  });
                  setPincodeLookup(
                    pincode.length === 0
                      ? { loading: false, message: "", tone: "muted" }
                      : pincode.length < 6
                        ? {
                            loading: false,
                            message: "Enter 6 digits to fetch city and state.",
                            tone: "muted",
                          }
                        : {
                            loading: true,
                            message: "Fetching city and state...",
                            tone: "muted",
                          }
                  );
                }}
                maxLength={6}
              />
            </div>
            {pincodeLookup.message && (
              <p
                className={`mt-3 text-sm ${
                  pincodeLookup.tone === "success"
                    ? "text-green-700"
                    : pincodeLookup.tone === "error"
                      ? "text-red-700"
                      : "text-[var(--color-text-secondary)]"
                }`}
              >
                {pincodeLookup.message}
              </p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{config.checkout.shippingAddressTitle}</h2>
            <div className="mt-5 space-y-4">
              <textarea
                className="input min-h-28"
                placeholder="Address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="input"
                  placeholder="City"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="State"
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                />
              </div>
              <textarea
                className="input min-h-20"
                placeholder="Notes for seller"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{config.checkout.paymentTitle}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {config.checkout.paymentDescription}
            </p>
          </section>
        </div>

        <aside>
          <div className="rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-semibold">{config.checkout.orderSummaryTitle}</h2>
            <div className="mt-5 max-h-72 space-y-4 overflow-auto">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {config.checkout.quantityLabel} {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  {config.checkout.subtotalLabel}
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">
                  {config.checkout.shippingLabel}
                </span>
                <span>
                  {shipping === 0 ? config.checkout.freeShippingLabel : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-semibold">
                <span>{config.checkout.totalLabel}</span>
                <span className="text-[var(--color-primary)]">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-6 w-full disabled:opacity-60"
            >
              {submitting
                ? config.checkout.preparingPaymentLabel
                : config.checkout.continueToPaymentLabel}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
