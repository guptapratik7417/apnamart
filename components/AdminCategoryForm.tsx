"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateSlug } from "@/lib/utils";
import type { Category, CreateCategoryInput } from "@/types";

export default function AdminCategoryForm({
  category,
}: {
  category: Category;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CreateCategoryInput>({
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    image_url: category.image_url || "",
    display_order: category.display_order || 0,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slug: form.slug || generateSlug(form.name),
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Category update failed");
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  async function uploadCategoryImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);

    const body = new FormData();
    body.set("folder", "categories");
    body.append("files", file);

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

    setForm({ ...form, image_url: payload.urls[0] });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl rounded-lg bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Name</span>
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
          value={form.description || ""}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Display Order</span>
          <input
            className="input"
            type="number"
            value={form.display_order || 0}
            onChange={(event) =>
              setForm({ ...form, display_order: Number(event.target.value || 0) })
            }
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Upload Image</span>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => uploadCategoryImage(event.target.files)}
          />
          {uploading && (
            <span className="block text-xs text-[var(--color-text-secondary)]">
              Uploading...
            </span>
          )}
        </label>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-medium">Image URL</span>
        <input
          className="input"
          value={form.image_url || ""}
          onChange={(event) => setForm({ ...form, image_url: event.target.value })}
        />
      </label>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? "Saving..." : "Update Category"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
