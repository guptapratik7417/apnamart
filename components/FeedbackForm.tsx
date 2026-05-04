"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const feedbackTypes = [
  "Website experience",
  "Product catalog",
  "Order experience",
  "Support experience",
  "Other",
];

export default function FeedbackForm() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    phone: "",
    feedback_type: feedbackTypes[0],
    rating: "5",
    message: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        phone: form.phone,
        order_id: "",
        subject: `Feedback: ${form.feedback_type} (${form.rating}/5)`,
        message: form.message,
      }),
    });

    const payload = (await response.json()) as {
      ticket?: { id: string };
      error?: string;
    };

    setSaving(false);

    if (!response.ok || !payload.ticket) {
      setError(payload.error || "Feedback could not be submitted.");
      return;
    }

    setSuccess(`Thank you. Feedback submitted as ticket ${payload.ticket.id}.`);
    setForm({
      customer_name: "",
      customer_email: "",
      phone: "",
      feedback_type: feedbackTypes[0],
      rating: "5",
      message: "",
    });
  }

  return (
    <form
      onSubmit={submit}
      className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-7"
    >
      {success && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Name
          </span>
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
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Email
          </span>
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

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Phone
          </span>
          <input
            className="input"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Feedback type
          </span>
          <select
            className="input"
            value={form.feedback_type}
            onChange={(event) =>
              setForm({ ...form, feedback_type: event.target.value })
            }
          >
            {feedbackTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Rating
          </span>
          <select
            className="input"
            value={form.rating}
            onChange={(event) => setForm({ ...form, rating: event.target.value })}
          >
            {["5", "4", "3", "2", "1"].map((rating) => (
              <option key={rating} value={rating}>
                {rating} out of 5
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Your feedback
        </span>
        <textarea
          className="input min-h-40"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
        />
      </label>

      <button type="submit" className="btn-primary mt-5" disabled={saving}>
        {saving ? "Submitting..." : "Share Feedback"}
      </button>
    </form>
  );
}
