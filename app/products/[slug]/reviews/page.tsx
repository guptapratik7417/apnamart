import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewsSection from "@/components/ReviewsSection";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSiteConfig } from "@/lib/site-config";
import {
  checkUserCanReview,
  getProductBySlug,
  getProductBySlugIncludingInactive,
  getReviews,
} from "@/lib/store";

type ProductReviewsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductReviewsPage({
  params,
  searchParams,
}: ProductReviewsPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const autoEditReview = first(query.editReview) === "1";
  const product =
    (await getProductBySlug(slug)) ||
    (autoEditReview ? await getProductBySlugIncludingInactive(slug) : null);

  if (!product) notFound();

  const [config, reviews, session] = await Promise.all([
    getSiteConfig(),
    getReviews(product.id),
    getCustomerSession(),
  ]);
  const reviewEligibility = session
    ? await checkUserCanReview(
        product.id,
        session.id,
        session.email,
        config.reviews.reviewWindowDays,
        "product"
      )
    : {
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        eligibleUntil: null,
        reviewId: null,
        canEditReview: false,
        reviewEditableUntil: null,
      };

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-border-light)] bg-white">
        <div className="container-custom py-4 text-sm text-[var(--color-text-secondary)]">
          <Link href="/" className="hover:text-[var(--color-primary)]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-[var(--color-primary)]">
            Products
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[var(--color-primary)]"
          >
            {product.name}
          </Link>
          <span className="mx-2">/</span>
          <span>Reviews</span>
        </div>
      </div>

      <section className="py-10">
        <div className="container-custom">
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Product Reviews
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
              Read verified customer reviews, add your review after a confirmed
              order, or edit your review within the configured review window.
            </p>
            <Link href={`/products/${product.slug}`} className="btn-outline mt-6 inline-flex">
              Back to Product
            </Link>
          </div>

          <div className="shadow-soft mt-8 rounded-[32px] border border-pink-100 bg-white p-6">
            <ReviewsSection
              productId={product.id}
              initialReviews={reviews}
              canReview={reviewEligibility.canReview}
              hasPurchased={reviewEligibility.hasPurchased}
              hasReviewed={reviewEligibility.hasReviewed}
              reviewWindowDays={config.reviews.reviewWindowDays}
              eligibleUntil={reviewEligibility.eligibleUntil}
              reviewId={reviewEligibility.reviewId}
              canEditReview={reviewEligibility.canEditReview}
              reviewEditableUntil={reviewEligibility.reviewEditableUntil}
              allowReviewEdits={config.reviews.allowReviewEdits}
              reviewEditWindowDays={config.reviews.reviewEditWindowDays}
              autoEditReview={autoEditReview}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
