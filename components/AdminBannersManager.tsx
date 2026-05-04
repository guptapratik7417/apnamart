"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BannerImage, CreateBannerImageInput } from "@/types";

type BannerForm = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  href: string;
  discountBadgeText: string;
  showDiscountBadge: boolean;
  display_order: string;
  is_active: boolean;
};

const emptyForm: BannerForm = {
  eyebrow: "",
  title: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  primaryCtaLabel: "Shop Now",
  primaryCtaHref: "/products",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  href: "/products",
  discountBadgeText: "",
  showDiscountBadge: false,
  display_order: "0",
  is_active: true,
};

function inputFromForm(form: BannerForm): CreateBannerImageInput {
  return {
    eyebrow: form.eyebrow,
    title: form.title,
    description: form.description,
    imageUrl: form.imageUrl,
    imageAlt: form.imageAlt || form.title,
    primaryCtaLabel: form.primaryCtaLabel || "Shop Now",
    primaryCtaHref: form.primaryCtaHref || form.href || "/products",
    secondaryCtaLabel: form.secondaryCtaLabel,
    secondaryCtaHref: form.secondaryCtaHref,
    href: form.href || form.primaryCtaHref || "/products",
    discountBadgeText: form.discountBadgeText,
    showDiscountBadge: form.showDiscountBadge,
    display_order: Number(form.display_order || 0),
    is_active: form.is_active,
  };
}

function formFromBanner(banner: BannerImage): BannerForm {
  return {
    eyebrow: banner.eyebrow,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    imageAlt: banner.imageAlt,
    primaryCtaLabel: banner.primaryCtaLabel,
    primaryCtaHref: banner.primaryCtaHref,
    secondaryCtaLabel: banner.secondaryCtaLabel,
    secondaryCtaHref: banner.secondaryCtaHref,
    href: banner.href,
    discountBadgeText: banner.discountBadgeText || "",
    showDiscountBadge: Boolean(banner.showDiscountBadge),
    display_order: String(banner.display_order),
    is_active: banner.is_active,
  };
}

export default function AdminBannersManager({
  banners,
}: {
  banners: BannerImage[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList | null) {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    setUploading(true);

    const body = new FormData();
    body.set("folder", "banners");
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

    setForm({ ...form, imageUrl: payload.urls[0] });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch(
      editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputFromForm(form)),
      }
    );
    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Banner save failed");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this banner?")) return;

    const response = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Banner delete failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Banner" : "Add Banner"}
        </h2>
        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Image Upload</span>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(event) => upload(event.target.files)}
            />
            {uploading && (
              <span className="block text-xs text-[var(--color-text-secondary)]">
                Uploading...
              </span>
            )}
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Image URL</span>
            <input
              className="input"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Eyebrow</span>
            <input
              className="input"
              value={form.eyebrow}
              onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Title</span>
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              className="input min-h-24"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">CTA Label</span>
              <input
                className="input"
                value={form.primaryCtaLabel}
                onChange={(event) =>
                  setForm({ ...form, primaryCtaLabel: event.target.value })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">CTA Link</span>
              <input
                className="input"
                value={form.primaryCtaHref}
                onChange={(event) =>
                  setForm({ ...form, primaryCtaHref: event.target.value })
                }
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Display Order</span>
              <input
                className="input"
                type="number"
                value={form.display_order}
                onChange={(event) =>
                  setForm({ ...form, display_order: event.target.value })
                }
              />
            </label>
            <label className="flex items-center gap-2 pt-8 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.checked })
                }
              />
              Active
            </label>
          </div>
          <div className="rounded-lg border border-pink-100 bg-[#fff8fb] p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.showDiscountBadge}
                onChange={(event) =>
                  setForm({ ...form, showDiscountBadge: event.target.checked })
                }
              />
              Show discount badge on this banner
            </label>
            <label className="mt-3 block space-y-2">
              <span className="text-sm font-medium">Discount badge text</span>
              <textarea
                className="input min-h-20"
                value={form.discountBadgeText}
                placeholder={"UP TO\n50%\nOFF"}
                onChange={(event) =>
                  setForm({ ...form, discountBadgeText: event.target.value })
                }
              />
            </label>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Use line breaks to control the popup text. Leave disabled to hide it.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving || uploading}>
            {saving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="grid gap-4 rounded-lg bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_auto]"
          >
            <div className="relative h-28 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={banner.imageUrl}
                alt={banner.imageAlt}
                fill
                unoptimized
                sizes="180px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{banner.title}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    banner.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {banner.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                {banner.description || "-"}
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Order {banner.display_order} · {banner.imageUrl}
              </p>
              {banner.showDiscountBadge && banner.discountBadgeText && (
                <p className="mt-2 whitespace-pre-line text-xs font-semibold text-[var(--color-primary)]">
                  Badge: {banner.discountBadgeText}
                </p>
              )}
            </div>
            <div className="flex gap-2 md:flex-col">
              <button
                type="button"
                className="btn-outline px-3 py-2 text-sm"
                onClick={() => {
                  setEditingId(banner.id);
                  setForm(formFromBanner(banner));
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                onClick={() => remove(banner.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
