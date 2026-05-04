import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import InlineIcon, { type InlineIconName } from "@/components/InlineIcon";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  getOrderJourneySteps,
  getOrderStatusLabel,
} from "@/lib/order-journey";
import { getOrderById } from "@/lib/store";
import { formatPrice, getOrderStatusColor } from "@/lib/utils";

type OrderStatusPageProps = {
  params: Promise<{ id: string }>;
};

function formatLongDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getJourneyIcon(value: string, state: string): InlineIconName {
  if (state === "complete") return "check";
  if (value === "packed") return "boxOpen";
  if (value === "shipped") return "truck";
  if (value === "out_for_delivery") return "location";
  if (value === "delivered") return "gift";
  return "package";
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const user = await getCustomerSession();
  if (!user) redirect("/login?redirect=/orders");

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order || order.user_id !== user.id) notFound();

  const journeySteps = getOrderJourneySteps(order.status);
  const estimatedDelivery = addDays(order.created_at, 6);
  const address = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-10">
        <div className="container-custom">
          <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/orders" className="hover:text-[var(--color-primary)]">
              Track Your Order
            </Link>
          </div>
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                  Track Your Order
                </p>
                <h1 className="mt-3 text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl">
                  Stay updated with your delivery journey.
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-[var(--color-text-secondary)]">
                  Your order is moving through each step with status updates here.
                </p>
              </div>
              <div className="rounded-[24px] border border-pink-100 bg-white p-5 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Current Order</p>
                <h2 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
                  {order.order_number}
                </h2>
                <span
                  className={`mt-4 inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getOrderStatusColor(order.status)}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
            </div>
            <div>
              <Link
                href={`/help-support?orderId=${order.id}`}
                className="pink-gradient mt-6 inline-flex rounded-2xl px-8 py-3 text-sm font-semibold text-white"
              >
                Get Live Updates
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container-custom py-8">
        <section className="shadow-soft grid gap-4 rounded-[32px] border border-pink-100 bg-white p-6 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-center">
            <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-[var(--color-primary)]">
              <InlineIcon name="package" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Order ID</p>
              <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
                {order.order_number}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Placed on {formatLongDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="border-pink-100 md:border-l md:pl-6">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Estimated Delivery
            </p>
            <p className="mt-1 font-serif text-xl font-bold text-[var(--color-primary)]">
              {formatLongDate(estimatedDelivery)}
            </p>
          </div>
          <div className="border-pink-100 md:border-l md:pl-6">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Delivery Address
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
              {address}
            </p>
          </div>
          <Link
            href={`/help-support?orderId=${order.id}`}
            className="btn-primary justify-center px-5 py-3 text-sm"
          >
            Need Help
          </Link>
        </section>

        <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
          <div className="flex flex-col gap-2 border-b border-pink-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Order Status
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Live delivery journey for this order.
              </p>
            </div>
            <p className="text-lg font-semibold">
              Total{" "}
              <span className="text-[var(--color-primary)]">
                {formatPrice(order.total)}
              </span>
            </p>
          </div>

          <div className="relative mt-8">
            <div className="absolute left-[10%] right-[10%] top-7 hidden h-1 rounded-full bg-pink-100 md:block" />
            <div
              className="absolute left-[10%] top-7 hidden h-1 rounded-full bg-[var(--color-primary)] md:block"
              style={{
                width: `${Math.max((journeySteps.findIndex((step) => step.state === "current") + 1) || 1, 1) * 20}%`,
              }}
            />
            <div className="grid gap-x-4 gap-y-6 md:grid-cols-5">
            {journeySteps.map((step) => {
              const isDone = step.state === "complete";
              const isCurrent = step.state === "current";
              const isCancelled = step.state === "cancelled";
              const isActive = isDone || isCurrent;

              return (
                <div key={step.value} className="relative min-w-0 p-2 text-center">
                  <div
                    className={`relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : isCancelled
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-pink-100 bg-white text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <InlineIcon
                      name={getJourneyIcon(step.value, step.state)}
                      className={isCurrent ? "h-8 w-8" : "h-6 w-6"}
                    />
                  </div>
                  <div className="mt-5">
                    <h3
                      className={`text-lg font-semibold ${
                        isActive
                          ? "text-[var(--color-primary)]"
                          : isCancelled
                            ? "text-red-700"
                            : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {step.description}
                    </p>
                    {isCurrent && (
                      <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
                        Current status
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-[#fff1f6] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Good things are on the way
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                We will update the status as your order moves along.
              </p>
            </div>
            <Link
              href={`/help-support?orderId=${order.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-primary)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary)]"
            >
              <InlineIcon name="bell" className="h-4 w-4" />
              Get Real-time Updates
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Order Summary
              </h2>
              <Link
                href="/orders"
                className="text-sm font-semibold text-[var(--color-primary)]"
              >
                View Orders
              </Link>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={`${item.id || item.product_id}-${item.product_name}`}
                  className="flex gap-4 border-b border-pink-100 pb-4 text-sm last:border-b-0 last:pb-0"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#fff8fb]">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {item.product_name}
                    </p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">
                      Qty {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-5 space-y-3 border-t border-pink-100 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">Shipping</dt>
                <dd className="font-semibold">{formatPrice(order.shipping_charge)}</dd>
              </div>
              <div className="flex justify-between text-lg">
                <dt className="font-bold">Total Paid</dt>
                <dd className="font-bold text-[var(--color-primary)]">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Delivery Details
            </h2>
            <div className="mt-5 rounded-lg bg-[#fff8fb] p-5">
              <p className="font-semibold text-[var(--color-text-primary)]">
                {order.shipping_name}
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                Phone: {order.shipping_phone || "Not available"}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {address}
              </p>
            </div>
            <div className="mt-5 rounded-2xl bg-[#fff1f6] p-5">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Need to make a change?
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/help-support?orderId=${order.id}`}
                  className="rounded-lg border border-pink-100 bg-white p-4 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Reschedule Delivery
                  <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
                    Pick a new delivery date
                  </span>
                </Link>
                <Link
                  href={`/help-support?orderId=${order.id}`}
                  className="rounded-lg border border-pink-100 bg-white p-4 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Cancel Order
                  <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
                    Request cancellation
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        <section className="shadow-soft mt-6 grid gap-4 rounded-[32px] border border-pink-100 bg-[#fff1f6] p-6 md:grid-cols-4 md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Need Help?
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              We are here for you.
            </p>
          </div>
          <Link href="/help-support" className="rounded-lg bg-white p-4 text-sm font-semibold text-[var(--color-primary)]">
            <InlineIcon name="comments" className="mb-2 h-5 w-5" />
            Live Chat
            <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
              Chat with us
            </span>
          </Link>
          <a href={`tel:${order.shipping_phone || ""}`} className="rounded-lg bg-white p-4 text-sm font-semibold text-[var(--color-primary)]">
            <InlineIcon name="phone" className="mb-2 h-5 w-5" />
            Call Us
            <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
              {order.shipping_phone || "Support phone"}
            </span>
          </a>
          <Link href="/help-support" className="rounded-lg bg-white p-4 text-sm font-semibold text-[var(--color-primary)]">
            <InlineIcon name="envelope" className="mb-2 h-5 w-5" />
            Email Us
            <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
              Support team
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
