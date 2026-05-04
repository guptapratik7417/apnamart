import { NextRequest, NextResponse } from "next/server";

import { getReviews, checkUserCanReview } from "@/lib/store";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSiteConfig } from "@/lib/site-config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const session = await getCustomerSession();

    const reviews = await getReviews(productId);

    // Check if current user can review
    let canReview = false;
    let hasPurchased = false;
    let hasReviewed = false;
    let eligibleUntil: string | null | undefined = null;
    let reviewId: string | null | undefined = null;
    let canEditReview = false;
    let reviewEditableUntil: string | null | undefined = null;

    if (session) {
      const config = await getSiteConfig();
      const check = await checkUserCanReview(
        productId,
        session.id,
        session.email,
        config.reviews.reviewWindowDays,
        "product"
      );
      canReview = check.canReview;
      hasPurchased = check.hasPurchased;
      hasReviewed = check.hasReviewed;
      eligibleUntil = check.eligibleUntil;
      reviewId = check.reviewId;
      canEditReview = check.canEditReview;
      reviewEditableUntil = check.reviewEditableUntil;
    }

    return NextResponse.json({
      reviews,
      canReview,
      hasPurchased,
      hasReviewed,
      eligibleUntil,
      reviewId,
      canEditReview,
      reviewEditableUntil,
    });
  } catch (error) {
    console.error("Failed to get reviews:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 }
    );
  }
}
