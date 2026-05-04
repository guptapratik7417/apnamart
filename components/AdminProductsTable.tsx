"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function AdminProductsTable({
  products,
  readOnly = false,
}: {
  products: Product[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");

  async function patchProduct(id: string, patch: Partial<Product>) {
    setBusyId(id);
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusyId("");
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Product update failed");
      return;
    }
    router.refresh();
  }

  async function removeProduct(id: string) {
    if (!window.confirm("Delete this product?")) return;
    setBusyId(id);
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setBusyId("");
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Product delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[980px]">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Rating</th>
            <th className="px-5 py-3 font-medium">Stock</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Featured</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-light)]">
          {products.map((product) => {
            const image = product.images[0]?.image_url;
            const busy = busyId === product.id;

            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                      {image && (
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          unoptimized
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {product.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm">
                  {product.category?.name || "Uncategorized"}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium">{formatPrice(product.price)}</p>
                  {product.original_price && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 text-sm">
                  <p className="font-medium">{product.rating_average.toFixed(1)} / 5</p>
                  <p className="text-[var(--color-text-secondary)]">
                    {product.review_count} review
                    {product.review_count === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={
                      product.stock_quantity <= 10
                        ? "font-semibold text-yellow-700"
                        : ""
                    }
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    disabled={busy || readOnly}
                    onClick={() =>
                      patchProduct(product.id, {
                        is_active: !product.is_active,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      product.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    disabled={busy || readOnly}
                    onClick={() =>
                      patchProduct(product.id, {
                        is_featured: !product.is_featured,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      product.is_featured
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.is_featured ? "Featured" : "No"}
                  </button>
                </td>
                <td className="px-5 py-4 text-right">
                  {readOnly ? (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Read only
                    </span>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-sm text-[var(--color-primary)] hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeProduct(product.id)}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
