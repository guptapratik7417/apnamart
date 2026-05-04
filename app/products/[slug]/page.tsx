import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { formatAttributeTag, formatPrice } from "@/lib/utils";
import { getSiteConfig } from "@/lib/site-config";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/store";

type ProductDetailProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [relatedProducts, config] = await Promise.all([
    getRelatedProducts(product),
    getSiteConfig(),
  ]);

  const primaryImage =
    product.images.find((image) => image.is_primary) || product.images[0];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-border-light)] bg-white">
        <div className="container-custom py-4 text-sm text-[var(--color-text-secondary)]">
          <Link href="/" className="hover:text-[var(--color-primary)]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-[var(--color-primary)]">
            Products
          </Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-[var(--color-primary)]"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="container-custom grid gap-10 py-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
            {primaryImage?.image_url ? (
              <Image
                src={primaryImage.image_url}
                alt={product.name}
                fill
                unoptimized
                preload
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((image) => (
                <div
                  key={image.image_url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-white"
                >
                  <Image
                    src={image.image_url}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm font-semibold text-[var(--color-primary)]"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-4xl font-bold text-[var(--color-secondary)]">
            {product.name}
          </h1>
          {product.review_count > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-yellow-50 px-3 py-1 font-semibold text-yellow-800">
                {product.rating_average.toFixed(1)} / 5
              </span>
              <Link
                href={`/products/${product.slug}/reviews`}
                className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
              >
                {config.productDetail.reviewCountPrefix} {product.review_count} review
                {product.review_count === 1 ? "" : "s"}
              </Link>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--color-primary)]">
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          <p className="mt-6 text-[var(--color-text-secondary)]">
            {product.description}
          </p>

          <dl className="mt-8 grid gap-3 rounded-lg bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-text-muted)]">
                {config.productDetail.productTypeLabel}
              </dt>
              <dd className="mt-1 font-medium">
                {formatAttributeTag(product.attribute_tag, config.productAttributes)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">
                {config.productDetail.detailsLabel}
              </dt>
              <dd className="mt-1 font-medium">
                {product.weight_grams
                  ? `${product.weight_grams}g`
                  : config.productDetail.fallbackDetailsText}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">
                {config.productDetail.shippingLabel}
              </dt>
              <dd className="mt-1 font-medium">
                {config.productDetail.shippingFreePrefix}{" "}
                {formatPrice(config.shipping.freeAbove)}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>

          <div className="mt-4">
            <Link
              href={`/products/${product.slug}/reviews`}
              className="btn-outline inline-flex"
            >
              View Product Reviews
            </Link>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="container-custom pb-14">
          <h2 className="mb-6 font-serif text-2xl font-bold">
            {config.productDetail.relatedProductsTitle}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                attributeOptions={config.productAttributes}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
