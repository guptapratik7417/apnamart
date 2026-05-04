"use client";

import { useState } from "react";
import {
  toggleWishlistProduct,
  useWishlistProduct,
} from "@/lib/wishlist-client";

export default function WishlistButton({ productId }: { productId: string }) {
  const isWishlisted = useWishlistProduct(productId);
  const [loading, setLoading] = useState(false);

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    const ok = await toggleWishlistProduct(productId);
    setLoading(false);
    if (!ok) window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm transition ${
        isWishlisted
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
      } disabled:opacity-60`}
    >
      {isWishlisted ? "♥" : "♡"}
    </button>
  );
}
