"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateSlug } from "@/lib/utils";
import type { Category, CreateCategoryInput } from "@/types";

export default function AdminCategoriesManager({
  categories,
  readOnly = false,
}: {
  categories: Category[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CreateCategoryInput>({
    name: "",
    slug: "",
    description: "",
    image_url: "",
  });

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slug: form.slug || generateSlug(form.name),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Category create failed");
      return;
    }

    setForm({ name: "", slug: "", description: "", image_url: "" });
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

  async function remove(id: string) {
    if (!window.confirm("Delete this category?")) return;

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Category delete failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {readOnly ? (
        <aside className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Read Access</h2>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            This admin can review categories but cannot create or delete them.
          </p>
        </aside>
      ) : (
        <form onSubmit={create} className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add Category</h2>
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
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
            <label className="block space-y-2">
              <span className="text-sm font-medium">Slug</span>
              <input
                className="input"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="input min-h-24"
                value={form.description || ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
            <label className="block space-y-2">
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
            <label className="block space-y-2">
              <span className="text-sm font-medium">Uploaded Image URL</span>
              <input
                className="input"
                value={form.image_url || ""}
                onChange={(event) =>
                  setForm({ ...form, image_url: event.target.value })
                }
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn-primary mt-5 w-full"
            disabled={saving || uploading}
          >
            {saving ? "Saving..." : "Create Category"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-light)]">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-5 py-4 font-medium">{category.name}</td>
                <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                  {category.slug}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                  {category.description || "-"}
                </td>
                <td className="px-5 py-4 text-right">
                  {readOnly ? (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Read only
                    </span>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="text-sm text-[var(--color-primary)] hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => remove(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
