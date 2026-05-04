import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";
import { calculateDiscount, formatAttributeTag, formatPrice } from "@/lib/utils";
import type { Product, ProductAttributeOption } from "@/types";

type ProductCardProps = {
  product: Product;
  eager?: boolean;
  attributeOptions?: ProductAttributeOption[];
};

export default function ProductCard({
  product,
  eager = false,
  attributeOptions = [],
}: ProductCardProps) {
  const discount = product.original_price
    ? calculateDiscount(product.original_price, product.price)
    : 0;
  const primaryImage = product.images.find((image) => image.is_primary) ||
    product.images[0];
  const productHref = `/products/${product.slug}`;

  return (
    <article className="card group flex h-full flex-col">
      <div className="relative">
        <Link href={productHref} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {primaryImage?.image_url ? (
            <Image
              src={primaryImage.image_url}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : undefined}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}

          {discount > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-pink-50 px-2 py-1 text-xs font-bold text-[var(--color-primary)]">
              {discount}% OFF
            </span>
          )}

          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-50/90 text-sm font-semibold text-[var(--color-primary)]">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                Out of stock
              </span>
            </div>
          )}
        </div>
        </Link>
        <WishlistButton productId={product.id} />
      </div>

      <Link href={productHref} className="flex flex-1 flex-col p-3 text-left">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
            {product.name}
          </p>
          <div className="mt-1 flex min-h-5 flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            {product.attribute_tag && (
              <span>{formatAttributeTag(product.attribute_tag, attributeOptions)}</span>
            )}
            {product.weight_grams && <span>{product.weight_grams}g</span>}
          </div>
          {product.review_count > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="rounded-full bg-yellow-50 px-2 py-1 font-semibold text-yellow-800">
                {product.rating_average.toFixed(1)} / 5
              </span>
              <span className="line-clamp-1">
                {product.review_count} review{product.review_count === 1 ? "" : "s"}
              </span>
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
            <span className="text-base font-bold text-[var(--color-secondary)]">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-[var(--color-text-muted)] line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
      </Link>
    </article>
  );
}
