import Link from "next/link";
import { redirect } from "next/navigation";

import CompanyReviewForm from "@/components/CompanyReviewForm";
import OrderRefundButton from "@/components/OrderRefundButton";
import { getCustomerSession } from "@/lib/customer-auth";
import { getOrderStatusLabel } from "@/lib/order-journey";
import { getSiteConfig } from "@/lib/site-config";
import {
  checkUserCanReview,
  getEditableProductReviewIdsForUser,
  getOrdersByUserId,
  getProducts,
  getReviewableProductIdsForUser,
} from "@/lib/store";
import {
  formatPrice,
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatNumericDate(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

const refundableStatuses = new Set([
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
]);

export default async function OrderHistoryPage() {
  const user = await getCustomerSession();
  if (!user) redirect("/login?redirect=/orders");

  const [orders, config] = await Promise.all([
    getOrdersByUserId(user.id),
    getSiteConfig(),
  ]);
  const reviewableProductIds = await getReviewableProductIdsForUser(
    user.id,
    config.reviews.reviewWindowDays
  );
  const editableReviewProductIds = config.reviews.allowReviewEdits
    ? await getEditableProductReviewIdsForUser(
        user.id,
        config.reviews.reviewEditWindowDays
      )
    : new Map<string, { reviewId: string; editableUntil: string | null }>();
  const linkedProductIds = Array.from(
    new Set([...reviewableProductIds.keys(), ...editableReviewProductIds.keys()])
  );
  const linkedProducts = linkedProductIds.length
    ? await getProducts({
        ids: linkedProductIds,
        includeInactive: true,
        limit: linkedProductIds.length,
      })
    : [];
  const productSlugs = new Map(
    linkedProducts.map((product) => [product.id, product.slug])
  );
  const companyReviewEligibility = await checkUserCanReview(
    null,
    user.id,
    user.email,
    config.reviews.reviewWindowDays,
    "company"
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="border-b border-pink-100 bg-[#fff1f6] py-12">
        <div className="container-custom">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Track Orders
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl">
            Order History
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Track your order journey, payment status, and order totals.
          </p>
        </div>
      </section>

      <div className="container-custom py-8">
        <CompanyReviewForm
          canReview={companyReviewEligibility.canReview}
          reviewWindowDays={config.reviews.reviewWindowDays}
        />
        {orders.length === 0 ? (
          <div className="rounded-lg border border-pink-100 bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Your completed orders will appear here.
            </p>
            <Link href="/products" className="btn-primary mt-6 inline-flex">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-lg border border-pink-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-pink-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {formatDate(order.created_at)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {order.order_number}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      Deliver to {order.shipping_name}, {order.shipping_city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getOrderStatusColor(order.status)}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/orders/${order.id}/status`}
                      className="inline-flex items-center rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                    >
                      Order Status
                    </Link>
                    {refundableStatuses.has(order.status) && (
                      <OrderRefundButton orderId={order.id} />
                    )}
                    <Link
                      href={`/help-support?orderId=${order.id}`}
                      className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      Help
                    </Link>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.id || item.product_name}`}
                      className="flex flex-col gap-3 rounded-lg border border-pink-100 bg-[#fff8fb] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-[var(--color-text-secondary)]">
                          Qty {item.quantity} x {formatPrice(item.price)}
                        </p>
                        {item.product_id &&
                          reviewableProductIds.has(item.product_id) &&
                          reviewableProductIds.get(item.product_id) && (
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Review by{" "}
                            {formatNumericDate(reviewableProductIds.get(item.product_id))}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        {item.product_id &&
                          reviewableProductIds.has(item.product_id) &&
                          productSlugs.has(item.product_id) && (
                          <Link
                            href={`/products/${productSlugs.get(item.product_id) || ""}/reviews`}
                            className="rounded-md border border-[var(--color-primary)] px-2 py-1 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                          >
                            Review Product
                          </Link>
                        )}
                        {item.product_id &&
                          editableReviewProductIds.has(item.product_id) &&
                          productSlugs.has(item.product_id) && (
                          <Link
                            href={`/products/${productSlugs.get(item.product_id) || ""}/reviews?editReview=1`}
                            className="rounded-md border border-[var(--color-primary)] px-2 py-1 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
                          >
                            Edit Review
                          </Link>
                        )}
                        <p className="font-semibold">{formatPrice(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-pink-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[var(--color-text-secondary)]">
                    Payment method:{" "}
                    <span className="font-medium capitalize text-[var(--color-text-primary)]">
                      {order.payment_method || "cod"}
                    </span>
                  </p>
                  <p className="text-lg font-semibold">
                    Total{" "}
                    <span className="text-[var(--color-primary)]">
                      {formatPrice(order.total)}
                    </span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
