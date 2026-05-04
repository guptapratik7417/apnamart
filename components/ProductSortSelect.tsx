"use client";

import { useRouter } from "next/navigation";
import type { ProductSortOption, ProductsQueryParams } from "@/types";

type SortValue = NonNullable<ProductsQueryParams["sort"]>;

type ProductSortSelectProps = {
  action: "/" | "/products";
  category?: string;
  attributeTag?: string;
  minRating?: number;
  query?: string;
  sort?: ProductsQueryParams["sort"];
  defaultSort: SortValue;
  options: ProductSortOption[];
};

export default function ProductSortSelect({
  action,
  category,
  attributeTag,
  minRating,
  query,
  sort,
  defaultSort,
  options,
}: ProductSortSelectProps) {
  const router = useRouter();

  function applySort(nextSort: string) {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (attributeTag) params.set("attribute_tag", attributeTag);
    if (minRating && minRating > 0) params.set("min_rating", String(minRating));
    if (query) params.set("q", query);
    if (nextSort) params.set("sort", nextSort);

    const queryString = params.toString();
    router.push(queryString ? `${action}?${queryString}` : action, {
      scroll: false,
    });
  }

  return (
    <div className="mb-6 flex justify-end">
      <label className="flex w-full items-center gap-3 sm:w-auto">
        <span className="whitespace-nowrap text-sm font-semibold text-[var(--color-text-secondary)]">
          Sort by
        </span>
        <select
          name="sort"
          value={sort || defaultSort}
          className="input sm:w-52"
          onChange={(event) => applySort(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
