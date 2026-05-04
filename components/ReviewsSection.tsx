"use client";

import Image from "next/image";
import { useState } from "react";
import type { Review } from "@/types";

interface ReviewsSectionProps {
  productId: string;
  initialReviews: Review[];
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  reviewWindowDays: number;
  eligibleUntil?: string | null;
  reviewId?: string | null;
  canEditReview: boolean;
  reviewEditableUntil?: string | null;
  allowReviewEdits: boolean;
  reviewEditWindowDays: number;
  autoEditReview: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function formatReviewDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export default function ReviewsSection({
  productId,
  initialReviews,
  canReview,
  hasPurchased,
  hasReviewed,
  reviewWindowDays,
  eligibleUntil,
  reviewId,
  canEditReview,
  reviewEditableUntil,
  allowReviewEdits,
  reviewEditWindowDays,
  autoEditReview,
}: ReviewsSectionProps) {
  const initialEditableReview =
    autoEditReview && canEditReview
      ? initialReviews.find((review) => review.id === reviewId) || null
      : null;
  const [reviews, setReviews] = useState(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(Boolean(initialEditableReview));
  const [editingReviewId, setEditingReviewId] = useState<string | null>(
    initialEditableReview?.id || null
  );
  const [localCanReview, setLocalCanReview] = useState(canReview);
  const [localCanEditReview, setLocalCanEditReview] = useState(canEditReview);
  const [formData, setFormData] = useState({
    rating: initialEditableReview?.rating || 5,
    review_text: initialEditableReview?.review_text || "",
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.set("product_id", productId);
      body.set("rating", String(formData.rating));
      body.set("review_text", formData.review_text);
      mediaFiles.forEach((file) => body.append("media", file));

      if (editingReviewId) body.set("review_id", editingReviewId);

      const response = await fetch("/api/reviews", {
        method: editingReviewId ? "PATCH" : "POST",
        body,
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews(
          editingReviewId
            ? reviews.map((review) =>
                review.id === editingReviewId ? newReview : review
              )
            : [newReview, ...reviews]
        );
        setShowReviewForm(false);
        setEditingReviewId(null);
        setLocalCanReview(false);
        setLocalCanEditReview(allowReviewEdits);
        setFormData({ rating: 5, review_text: "" });
        setMediaFiles([]);
      } else {
        const payload = await response.json();
        alert(payload.error || "Failed to submit review");
      }
    } catch {
      alert("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewStatusMessage = hasReviewed
    ? localCanEditReview
      ? `You can edit your review for ${reviewEditWindowDays} days after posting.`
      : "You have already reviewed this product."
    : hasPurchased
      ? `Reviews are accepted within ${reviewWindowDays} days of order confirmation.`
      : "Review option appears after your order for this product is confirmed.";

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            disabled={!interactive}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={`text-lg ${interactive ? "cursor-pointer" : "cursor-default"} ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold">Customer Reviews</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>
        {localCanReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn-primary"
          >
            Write a Review
          </button>
        )}
      </div>
      {!canReview && (
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {reviewStatusMessage}
        </p>
      )}
      {localCanReview && eligibleUntil && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          You can review this product until{" "}
          {formatReviewDate(eligibleUntil)}.
        </p>
      )}
      {localCanEditReview && reviewEditableUntil && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          You can edit your review until {formatReviewDate(reviewEditableUntil)}.
        </p>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="rounded-lg border border-[var(--color-border-light)] bg-white p-6">
          <h4 className="mb-4 font-semibold">
            {editingReviewId ? "Edit Your Review" : "Write Your Review"}
          </h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(formData.rating, true, (rating) =>
                setFormData({ ...formData, rating })
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder="Share your thoughts about this product..."
                className="input w-full"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Add photos or video
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="input w-full"
                onChange={(event) =>
                  setMediaFiles(Array.from(event.target.files || []).slice(0, 3))
                }
              />
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Up to 3 files. Images or videos, 10MB each.
                {editingReviewId ? " Selecting files replaces existing media." : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReviewId(null);
                  setFormData({ rating: 5, review_text: "" });
                  setMediaFiles([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-[var(--color-text-secondary)]">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-[var(--color-border-light)] bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="font-medium">
                    {review.customer_name || "Anonymous"}
                  </p>
                  <p className="mt-2 text-[var(--color-text-secondary)]">
                    {review.review_text}
                  </p>
                  {review.media_urls.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {review.media_urls.map((url) => {
                        const isVideo = /\.(mp4|webm|mov)$/i.test(url);

                        return isVideo ? (
                          <video
                            key={url}
                            src={url}
                            controls
                            className="aspect-square w-full rounded-lg border border-[var(--color-border-light)] object-cover"
                          />
                        ) : (
                          <Image
                            key={url}
                            src={url}
                            alt="Review media"
                            width={320}
                            height={320}
                            unoptimized
                            className="aspect-square w-full rounded-lg border border-[var(--color-border-light)] object-cover"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {formatReviewDate(review.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
