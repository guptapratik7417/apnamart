"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";

export default function AdminInventoryTable({
  products,
  readOnly = false,
}: {
  products: Product[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(products.map((product) => [product.id, product.stock_quantity]))
  );
  const [busyId, setBusyId] = useState("");

  async function saveStock(product: Product) {
    setBusyId(product.id);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_quantity: values[product.id] }),
    });
    setBusyId("");

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Stock update failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-[720px]">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Current Stock</th>
            <th className="px-5 py-3 font-medium">New Stock</th>
            <th className="px-5 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-light)]">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-5 py-4">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {product.slug}
                </p>
              </td>
              <td className="px-5 py-4 text-sm">
                {product.category?.name || "Uncategorized"}
              </td>
              <td className="px-5 py-4">
                <span
                  className={
                    product.stock_quantity <= 10
                      ? "rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800"
                      : "text-sm font-medium"
                  }
                >
                  {product.stock_quantity}
                </span>
              </td>
              <td className="px-5 py-4">
                <input
                  type="number"
                  min="0"
                  className="input w-32"
                  value={values[product.id] ?? 0}
                  disabled={readOnly}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      [product.id]: Number(event.target.value),
                    })
                  }
                />
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  className="btn-outline px-4 py-2"
                  disabled={busyId === product.id || readOnly}
                  onClick={() => saveStock(product)}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
