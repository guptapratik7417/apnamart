"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Order, User } from "@/types";

export default function SupportForm({
  user,
  orders,
  selectedOrderId = "",
}: {
  user: User | null;
  orders: Order[];
  selectedOrderId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    customer_name: user?.full_name || "",
    customer_email: user?.email || "",
    phone: user?.phone || "",
    order_id: orders.some((order) => order.id === selectedOrderId)
      ? selectedOrderId
      : "",
    subject: "",
    message: "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.set(key, value));
    mediaFiles.forEach((file) => body.append("media", file));

    const response = await fetch("/api/support", {
      method: "POST",
      body,
    });

    const payload = (await response.json()) as {
      ticket?: { id: string };
      error?: string;
    };
    setSaving(false);

    if (!response.ok || !payload.ticket) {
      setError(payload.error || "Support request failed.");
      return;
    }

    setMessage(`Support ticket created: ${payload.ticket.id}`);
    setForm({
      customer_name: user?.full_name || "",
      customer_email: user?.email || "",
      phone: user?.phone || "",
      order_id: "",
      subject: "",
      message: "",
    });
    setMediaFiles([]);
  }

  return (
    <form
      onSubmit={submit}
      className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-7"
    >
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          Raise Ticket
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
          Tell us what happened
        </h2>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Name</span>
          <input
            className="input"
            value={form.customer_name}
            onChange={(event) =>
              setForm({ ...form, customer_name: event.target.value })
            }
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="input"
            type="email"
            value={form.customer_email}
            onChange={(event) =>
              setForm({ ...form, customer_email: event.target.value })
            }
            required
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Phone</span>
          <input
            className="input"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        {orders.length > 0 ? (
          <label className="space-y-2">
            <span className="text-sm font-medium">Select Order</span>
            <select
              className="input"
              value={form.order_id}
              onChange={(event) =>
                setForm({ ...form, order_id: event.target.value })
              }
            >
              <option value="">No specific order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number} · {order.status.replaceAll("_", " ")} ·{" "}
                  {formatPrice(order.total)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="rounded-lg border border-pink-100 bg-[#fff8fb] p-3 text-sm text-[var(--color-text-secondary)]">
            Login and place an order to attach support requests to order history.
          </div>
        )}
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Subject</span>
        <input
          className="input"
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          required
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">How can we help?</span>
        <textarea
          className="input min-h-36"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
        />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Upload photos or videos</span>
        <input
          className="input"
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(event) =>
            setMediaFiles(Array.from(event.target.files || []).slice(0, 3))
          }
        />
        <span className="block text-xs text-[var(--color-text-secondary)]">
          Up to 3 files. Images or videos, 10MB each.
        </span>
      </label>

      <button type="submit" className="btn-primary mt-5" disabled={saving}>
        {saving ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
