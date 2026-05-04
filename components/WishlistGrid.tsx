"use client";

import { useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import {
  initializeWishlistLines,
  useWishlistLines,
  WISHLIST_UPDATED_EVENT,
} from "@/lib/wishlist-client";
import type {
  Product,
  ProductAttributeOption,
  WishlistLine,
} from "@/types";

function wishlistLineToProduct(line: WishlistLine): Product {
  return {
    id: line.product_id,
    slug: line.slug,
    name: line.name,
    price: line.price,
    original_price: line.original_price,
    stock_quantity: line.stock_quantity,
    is_active: true,
    is_featured: false,
    rating_average: 0,
    review_count: 0,
    attribute_tag: line.attribute_tag,
    weight_grams: line.weight_grams,
    images: line.image_url
      ? [
          {
            image_url: line.image_url,
            is_primary: true,
            display_order: 0,
          },
        ]
      : [],
  };
}

export default function WishlistGrid({
  initialItems,
  attributeOptions,
}: {
  initialItems: WishlistLine[];
  attributeOptions: ProductAttributeOption[];
}) {
  useEffect(() => {
    initializeWishlistLines(initialItems);
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
  }, [initialItems]);

  const items = useWishlistLines();

  if (!items.length) {
    return (
      <div className="rounded-lg border border-[var(--color-border-light)] bg-white p-8 text-center shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)]">
          Your wishlist is empty
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
          Save products with the heart button and they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard
          key={item.product_id}
          product={wishlistLineToProduct(item)}
          attributeOptions={attributeOptions}
        />
      ))}
    </div>
  );
}
