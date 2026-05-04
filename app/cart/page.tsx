"use client";

import Image from "next/image";
import Link from "next/link";
import {
  getCartSubtotal,
  getShippingCharge,
  removeCartLine,
  updateCartQuantity,
  useCartLines,
} from "@/lib/cart-client";
import { useSiteConfig } from "@/lib/use-site-config";
import { formatAttributeTag, formatPrice } from "@/lib/utils";

export default function CartPage() {
  const items = useCartLines();
  const config = useSiteConfig();

  const subtotal = getCartSubtotal(items);
  const shipping = getShippingCharge(subtotal, config.shipping);
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="border-b border-pink-100 bg-[#fff1f6] py-12">
        <div className="container-custom">
          <h1 className="font-serif text-4xl font-bold text-[var(--color-text-primary)]">
            {config.cart.title}
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {items.length
              ? `${items.length} item${items.length > 1 ? "s" : ""}`
              : config.cart.emptyStatusText}
          </p>
        </div>
      </section>

      <div className="container-custom py-8">
        {items.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center">
            <h2 className="text-2xl font-semibold">{config.cart.emptyTitle}</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              {config.cart.emptyText}
            </p>
            <Link href="/products" className="btn-primary mt-6 inline-flex">
              {config.cart.emptyCtaLabel}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.product_id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
                    >
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-semibold hover:text-[var(--color-primary)]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {formatAttributeTag(item.attribute_tag, config.productAttributes)}
                          </p>
                          <p className="mt-2 font-semibold text-[var(--color-primary)]">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCartLine(item.product_id)}
                          className="h-fit text-sm text-red-600 hover:underline"
                        >
                          {config.cart.removeLabel}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="inline-flex items-center rounded-lg border border-[var(--color-border)]">
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-gray-50"
                            onClick={() =>
                              updateCartQuantity(item.product_id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="min-w-10 px-3 py-1 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-gray-50"
                            onClick={() =>
                              updateCartQuantity(item.product_id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            +
                          </button>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside>
              <div className="rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="text-xl font-semibold">{config.cart.orderSummaryTitle}</h2>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      {config.cart.subtotalLabel}
                    </span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      {config.cart.shippingLabel}
                    </span>
                    <span className="font-medium">
                      {shipping === 0 ? config.cart.freeShippingLabel : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-semibold">
                    <span>{config.cart.totalLabel}</span>
                    <span className="text-[var(--color-primary)]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                <Link href="/checkout" className="btn-primary mt-6 block text-center">
                  {config.cart.checkoutLabel}
                </Link>
                <Link href="/products" className="mt-4 block text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                  {config.cart.continueShoppingLabel}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
