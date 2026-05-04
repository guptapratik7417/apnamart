"use client";

import { useState } from "react";

export default function CompanyReviewForm({
  canReview,
  reviewWindowDays,
}: {
  canReview: boolean;
  reviewWindowDays: number;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  if (!canReview || submitted) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const body = new FormData();
    body.set("review_target", "company");
    body.set("rating", String(rating));
    body.set("review_text", reviewText);
    mediaFiles.forEach((file) => body.append("media", file));

    const response = await fetch("/api/reviews", {
      method: "POST",
      body,
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      alert(payload.error || "Review could not be submitted.");
      return;
    }

    setSubmitted(true);
    setMediaFiles([]);
    setOpen(false);
  }

  return (
    <section className="mb-6 rounded-lg bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review ApnaMart</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Available for {reviewWindowDays} days after an order is confirmed.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setOpen((value) => !value)}
        >
          Write Store Review
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 space-y-4 border-t border-[var(--color-border-light)] pt-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Rating</label>
            <select
              className="input sm:w-40"
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Review</label>
            <textarea
              className="input min-h-28"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Add photos or video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="input"
              onChange={(event) =>
                setMediaFiles(Array.from(event.target.files || []).slice(0, 3))
              }
            />
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              Up to 3 files. Images or videos, 10MB each.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
