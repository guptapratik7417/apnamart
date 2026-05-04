import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { getSiteConfig } from "@/lib/site-config";
import { getBannerImages, getCategories, getProducts } from "@/lib/store";
import type { ProductAttribute, ProductsQueryParams } from "@/types";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const categoryCardBackgrounds = [
  "bg-[#fff5d8]",
  "bg-[#ffe9ef]",
  "bg-[#f4efff]",
  "bg-[#fff0f2]",
  "bg-[#fff1f5]",
];

const offerStyles: Record<string, string> = {
  shipping: "bg-[#ffe6ef] text-[var(--color-primary)]",
  offers: "bg-[#f0ecff] text-[#6d4de8]",
  gifts: "bg-[#e9f8f1] text-[#168b63]",
};

const iconLabels: Record<string, string> = {
  truck: "🚚",
  percent: "%",
  gift: "🎁",
  secure: "▣",
  returns: "↩",
  support: "☏",
  quality: "☆",
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = first(params.category);
  const attributeTag = first(params.attribute_tag) as ProductAttribute | undefined;
  const query = first(params.q);
  const minRating = Number(first(params.min_rating) || 0);
  const sort = first(params.sort) as ProductsQueryParams["sort"];
  const productsQuery: ProductsQueryParams = {
    category,
    attribute_tag: attributeTag,
    min_rating: minRating || null,
    q: query,
    sort: sort || "featured",
    limit: 24,
  };

  const [products, categories, config, dbBanners] = await Promise.all([
    getProducts(productsQuery),
    getCategories(),
    getSiteConfig(),
    getBannerImages().catch(() => []),
  ]);
  const heroBanners = dbBanners.length ? dbBanners : config.heroBanners;

  const newArrivals = [...products]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);
  const bestSellers = [...products]
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 5);

  return (
    <div className="bg-[var(--color-bg)]">
      <HeroCarousel banners={heroBanners} />

      <section className="container-custom py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.slice(0, 5).map((item, index) => (
            <Link
              key={item.id}
              href={`/products?category=${item.slug}`}
              className="group relative min-h-[150px] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-pink-50 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`absolute inset-0 ${
                  categoryCardBackgrounds[index % categoryCardBackgrounds.length]
                }`}
              />
              {item.image_url && (
                <div className="pointer-events-none absolute inset-y-0 right-0 w-[54%] overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/90 to-transparent" />
                </div>
              )}

              <div className="relative z-10 flex min-h-[150px] max-w-[56%] flex-col justify-between p-4">
                <div>
                  <h3 className="text-xl font-semibold leading-tight text-[var(--color-secondary)]">
                    {item.name}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-5 text-[var(--color-text-secondary)]">
                    {item.description || "Discover more"}
                  </p>
                </div>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                  {config.home.categoryCardCta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-custom pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          {config.home.offerCards.map((offer) => (
            <Link
              key={`${offer.title}-${offer.href}`}
              href={offer.href}
              className={`flex items-center gap-5 rounded-lg p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                offerStyles[offer.style] || "bg-white text-[var(--color-secondary)]"
              }`}
            >
              <span className="text-4xl">{iconLabels[offer.iconLabel] || offer.iconLabel}</span>
              <span>
                <span className="block text-xl font-bold">{offer.title}</span>
                <span className="block text-sm text-[var(--color-text-secondary)]">{offer.text}</span>
                <span className="mt-2 block text-sm font-semibold">
                  {config.home.categoryCardCta} →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container-custom">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold">{config.home.newArrivalsTitle}</h2>
            <Link href="/products?sort=newest" className="text-sm font-semibold text-[var(--color-primary)]">
              {config.home.newArrivalsCtaLabel} →
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center">
              <h2 className="text-xl font-semibold">{config.home.noProductsTitle}</h2>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                {config.home.noProductsText}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {newArrivals.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  eager={index < 3}
                  attributeOptions={config.productAttributes}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white pb-10">
        <div className="container-custom">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold">{config.home.bestSellersTitle}</h2>
            <Link href="/products?sort=reviews_desc" className="text-sm font-semibold text-[var(--color-primary)]">
              {config.home.bestSellersCtaLabel} →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {bestSellers.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="overflow-hidden rounded-lg border border-[var(--color-border-light)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-pink-50">
                  {product.images[0]?.image_url && (
                    <Image
                      src={product.images[0].image_url}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 20vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <span className="mt-3 inline-flex rounded-md bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white">
                    {config.home.categoryCardCta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-border-light)] bg-white py-6">
        <div className="container-custom grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {config.home.serviceHighlights.map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <span className="text-2xl text-[var(--color-primary)]">
                {iconLabels[item.iconLabel] || item.iconLabel}
              </span>
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
