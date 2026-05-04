"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateSlug } from "@/lib/utils";
import type {
  Category,
  CreateProductInput,
  ProductAttribute,
  ProductAttributeOption,
  Product,
} from "@/types";

export default function AdminProductForm({
  categories,
  productAttributes,
  initialProduct,
}: {
  categories: Category[];
  productAttributes: ProductAttributeOption[];
  initialProduct?: Product;
}) {
  const router = useRouter();
  const editing = Boolean(initialProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: initialProduct?.name || "",
    slug: initialProduct?.slug || "",
    description: initialProduct?.description || "",
    price: initialProduct ? String(initialProduct.price) : "",
    original_price: initialProduct?.original_price
      ? String(initialProduct.original_price)
      : "",
    category_id: initialProduct?.category_id || "",
    stock_quantity: String(initialProduct?.stock_quantity ?? 0),
    rating_average: String(initialProduct?.rating_average ?? 0),
    review_count: String(initialProduct?.review_count ?? 0),
    attribute_tag: (initialProduct?.attribute_tag ||
      productAttributes[0]?.value ||
      "") as ProductAttribute,
    weight_grams: initialProduct?.weight_grams
      ? String(initialProduct.weight_grams)
      : "",
    images: initialProduct?.images.map((image) => image.image_url).join("\n") || "",
    is_active: initialProduct?.is_active ?? true,
    is_featured: initialProduct?.is_featured ?? false,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const input: CreateProductInput = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      category_id: form.category_id || null,
      stock_quantity: Number(form.stock_quantity),
      attribute_tag: form.attribute_tag,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      rating_average: Number(form.rating_average),
      review_count: Number(form.review_count),
      images: form.images
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    const response = await fetch(
      initialProduct ? `/api/products/${initialProduct.id}` : "/api/products",
      {
        method: initialProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || `Product ${editing ? "update" : "create"} failed`);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function uploadProductImages(files: FileList | null) {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    setUploading(true);

    const body = new FormData();
    body.set("folder", "products");
    fileList.forEach((file) => body.append("files", file));

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body,
    });
    setUploading(false);

    const payload = (await response.json()) as { urls?: string[]; error?: string };
    if (!response.ok || !payload.urls?.length) {
      alert(payload.error || "Image upload failed");
      return;
    }

    setForm({
      ...form,
      images: [form.images, ...payload.urls].filter(Boolean).join("\n"),
    });
  }

  return (
    <form onSubmit={submit} className="max-w-3xl rounded-lg bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Product Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm({ ...form, name, slug: generateSlug(name) });
            }}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Slug</span>
          <input
            className="input"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            required
          />
        </label>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <textarea
          className="input min-h-28"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Price</span>
          <input
            className="input"
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Original Price</span>
          <input
            className="input"
            type="number"
            min="0"
            value={form.original_price}
            onChange={(event) =>
              setForm({ ...form, original_price: event.target.value })
            }
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Stock</span>
          <input
            className="input"
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={(event) =>
              setForm({ ...form, stock_quantity: event.target.value })
            }
            required
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Rating Average</span>
          <input
            className="input"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating_average}
            onChange={(event) =>
              setForm({ ...form, rating_average: event.target.value })
            }
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Review Count</span>
          <input
            className="input"
            type="number"
            min="0"
            value={form.review_count}
            onChange={(event) =>
              setForm({ ...form, review_count: event.target.value })
            }
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <select
            className="input"
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Product Type</span>
          <select
            className="input"
            value={form.attribute_tag}
            onChange={(event) =>
              setForm({ ...form, attribute_tag: event.target.value as ProductAttribute })
            }
          >
            {productAttributes.map((attribute) => (
              <option key={attribute.value} value={attribute.value}>
                {attribute.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Optional Weight (g)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.weight_grams}
            onChange={(event) =>
              setForm({ ...form, weight_grams: event.target.value })
            }
          />
        </label>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium">Upload Product Images</span>
        <input
          className="input"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => uploadProductImages(event.target.files)}
        />
        {uploading && (
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Uploading...
          </span>
        )}
      </label>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium">Uploaded Image URLs</span>
        <textarea
          className="input min-h-24"
          placeholder="Upload images above, or keep one image URL per line"
          value={form.images}
          onChange={(event) => setForm({ ...form, images: event.target.value })}
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm({ ...form, is_active: event.target.checked })
            }
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(event) =>
              setForm({ ...form, is_featured: event.target.checked })
            }
          />
          Featured
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
