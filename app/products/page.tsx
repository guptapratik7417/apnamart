import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductSortSelect from "@/components/ProductSortSelect";
import { getSiteConfig } from "@/lib/site-config";
import { getCategories, getProducts } from "@/lib/store";
import type { ProductAttribute, ProductsQueryParams } from "@/types";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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
    sort: sort || "newest",
    limit: 48,
  };

  const [products, categories, config] = await Promise.all([
    getProducts(productsQuery),
    getCategories(),
    getSiteConfig(),
  ]);

  const activeCategory = categories.find((item) => item.slug === category);
  const activeSortLabel =
    config.productSortOptions.find((option) => option.value === productsQuery.sort)
      ?.label || config.productSortOptions[0]?.label || productsQuery.sort || "";
  const productHref = (
    overrides: Record<string, string | number | null | undefined>
  ) => {
    const hrefParams = new URLSearchParams();
    const values = {
      category,
      attribute_tag: attributeTag,
      min_rating: minRating || undefined,
      q: query,
      sort,
      ...overrides,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      hrefParams.set(key, String(value));
    });

    const queryString = hrefParams.toString();
    return queryString ? `/products?${queryString}` : "/products";
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="border-b border-pink-100 bg-[#fff1f6] py-12">
        <div className="container-custom">
          <h1 className="font-serif text-4xl font-bold text-[var(--color-text-primary)]">
            {activeCategory?.name ||
              (query ? `Search: ${query}` : config.home.collectionFallbackTitle)}
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {products.length}{" "}
            {products.length === 1
              ? config.productListing.productCountSingular
              : config.productListing.productCountPlural}{" "}
            · {config.productListing.sortedByLabel} {activeSortLabel}
          </p>
        </div>
      </section>

      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <div className="rounded-lg border border-[var(--color-border-light)] bg-white p-5">
              <h2 className="mb-4 font-semibold">{config.productListing.filtersTitle}</h2>
              <div className="space-y-2">
                <Link
                  href="/products"
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    !category
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                  }`}
                >
                  {config.productListing.allProductsLabel}
                </Link>
                {categories.map((item) => (
                  <Link
                    key={item.id}
                    href={productHref({ category: item.slug })}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      category === item.slug
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 border-t border-[var(--color-border-light)] pt-5">
                <h3 className="mb-3 text-sm font-semibold">
                  {config.productListing.productTypeTitle}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {config.productAttributes.map(
                    ({ value: attribute, label }) => (
                      <Link
                        key={attribute}
                        href={productHref({ attribute_tag: attribute })}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          attributeTag === attribute
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--color-border-light)] pt-5">
                <h3 className="mb-3 text-sm font-semibold">
                  {config.productListing.customerRatingTitle}
                </h3>
                <div className="space-y-2">
                  {config.productRatingFilters.map((option) => (
                    <Link
                      key={option.value}
                      href={productHref({ min_rating: option.value })}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        minRating === option.value
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section>
            <ProductSortSelect
              action="/products"
              category={category}
              attributeTag={attributeTag}
              minRating={minRating}
              query={query}
              sort={sort}
              defaultSort="newest"
              options={config.productSortOptions}
            />

            {products.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center">
                <h2 className="text-xl font-semibold">{config.home.noProductsTitle}</h2>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                  {config.home.noProductsText}
                </p>
                <Link href="/products" className="btn-primary mt-6 inline-flex">
                  {config.home.categoriesCtaLabel}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eager={index < 3}
                    attributeOptions={config.productAttributes}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
