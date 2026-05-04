import { NextRequest, NextResponse } from "next/server";

import {
  checkUserCanReview,
  createReview,
  getReviewById,
  updateReview,
} from "@/lib/store";
import { getCustomerSession } from "@/lib/customer-auth";
import { saveReviewMedia } from "@/lib/review-media";
import { getSiteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

type ParsedReviewRequest = {
  product_id?: string;
  review_target: "product" | "company";
  rating: number;
  review_text?: string;
  customer_name?: string;
  mediaFiles: File[];
};

async function parseReviewRequest(request: NextRequest): Promise<ParsedReviewRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const mediaFiles = formData
      .getAll("media")
      .filter((value): value is File => value instanceof File);

    return {
      product_id: String(formData.get("product_id") || ""),
      review_target:
        formData.get("review_target") === "company" ? "company" : "product",
      rating: Number(formData.get("rating")),
      review_text: String(formData.get("review_text") || ""),
      customer_name: String(formData.get("customer_name") || ""),
      mediaFiles,
    };
  }

  const body = await request.json();
  return {
    product_id: body.product_id,
    review_target: body.review_target === "company" ? "company" : "product",
    rating: body.rating,
    review_text: body.review_text,
    customer_name: body.customer_name,
    mediaFiles: [] as File[],
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    const body = await parseReviewRequest(request);
    const reviewTarget = body.review_target;
    const { product_id, rating, review_text } = body;

    if (reviewTarget === "product" && !product_id) {
      return NextResponse.json(
        { error: "product_id is required for product reviews" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating" },
        { status: 400 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const config = await getSiteConfig();
    const { canReview, hasPurchased, hasReviewed, isWithinReviewWindow } = await checkUserCanReview(
      reviewTarget === "product" ? product_id || null : null,
      session.id,
      session.email,
      config.reviews.reviewWindowDays,
      reviewTarget
    );

    if (!canReview) {
      const message = hasReviewed
        ? "You have already reviewed this."
        : !hasPurchased
          ? "You can review only after your order is confirmed."
          : !isWithinReviewWindow
            ? `Reviews are allowed within ${config.reviews.reviewWindowDays} days.`
            : "You are not eligible to review this yet.";

      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const mediaUrls = await saveReviewMedia(body.mediaFiles);
    const review = await createReview({
      product_id: reviewTarget === "product" ? product_id || null : null,
      review_target: reviewTarget,
      user_id: session.id,
      customer_name: session.full_name || body.customer_name,
      customer_email: session.email,
      rating,
      review_text: review_text || null,
      media_urls: mediaUrls,
    });

    return NextResponse.json({
      ...review,
      is_verified_purchase: hasPurchased,
    });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let reviewId = "";
    let rating = 0;
    let reviewText = "";
    let mediaFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      reviewId = String(formData.get("review_id") || "");
      rating = Number(formData.get("rating"));
      reviewText = String(formData.get("review_text") || "");
      mediaFiles = formData
        .getAll("media")
        .filter((value): value is File => value instanceof File);
    } else {
      const body = await request.json();
      reviewId = body.review_id || "";
      rating = Number(body.rating);
      reviewText = body.review_text || "";
    }

    if (!reviewId) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const existing = await getReviewById(reviewId);
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const config = await getSiteConfig();
    const editableUntil = new Date(existing.created_at).getTime() +
      config.reviews.reviewEditWindowDays * 24 * 60 * 60 * 1000;

    if (!config.reviews.allowReviewEdits || editableUntil < Date.now()) {
      return NextResponse.json(
        { error: "Review edit window has closed." },
        { status: 400 }
      );
    }

    const mediaUrls = mediaFiles.length
      ? await saveReviewMedia(mediaFiles)
      : existing.media_urls;
    const review = await updateReview(reviewId, {
      rating,
      review_text: reviewText || null,
      media_urls: mediaUrls,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
