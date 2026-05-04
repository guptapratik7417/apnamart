"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addProductToCart } from "@/lib/cart-client";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const inStock = product.stock_quantity > 0;

  async function addToCart() {
    setLoading(true);
    const added = await addProductToCart(product, quantity);
    setLoading(false);

    if (!added) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    router.push("/cart");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="inline-flex w-fit items-center rounded-lg border border-[var(--color-border)] bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-4 py-3 text-lg leading-none hover:bg-gray-50 disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="min-w-12 px-3 py-3 text-center font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((value) =>
                Math.min(product.stock_quantity, value + 1)
              )
            }
            className="px-4 py-3 text-lg leading-none hover:bg-gray-50 disabled:opacity-40"
            disabled={quantity >= product.stock_quantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={!inStock || loading}
          className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!inStock ? "Out of Stock" : loading ? "Checking..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
