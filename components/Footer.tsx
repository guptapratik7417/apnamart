"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import InlineIcon, { type InlineIconName } from "@/components/InlineIcon";
import type { Review, SiteConfig } from "@/types";

const fallbackReviews = [
  {
    id: "fallback-aaradhya",
    customer_name: "Aaradhya S.",
    rating: 5,
    review_text: "Lovely packaging, fast support, and the gifts looked premium.",
  },
  {
    id: "fallback-pratik",
    customer_name: "Pratik Gupta",
    rating: 5,
    review_text: "Very good quality and fast delivery. Loved the overall experience.",
  },
  {
    id: "fallback-neha",
    customer_name: "Neha K.",
    rating: 5,
    review_text: "Beautiful products and smooth shopping experience.",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-[0.12em] text-[#f5a400]" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
    </span>
  );
}

function FooterLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block text-sm font-semibold transition hover:translate-x-1 hover:text-[var(--color-primary)] ${
        active ? "text-[var(--color-primary)]" : "text-[#555]"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Footer({
  config,
  companyReviews,
}: {
  config: SiteConfig;
  companyReviews: Review[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname.startsWith("/admin")) return null;

  const reviews = companyReviews.length > 0 ? companyReviews : fallbackReviews;
  const activeCategory = pathname === "/products" ? searchParams.get("category") : null;

  function categoryFromHref(href: string) {
    const query = href.split("?")[1];
    if (!query) return null;
    return new URLSearchParams(query).get("category");
  }

  return (
    <footer className="bg-[linear-gradient(135deg,#fff1f6,#ffe6ef)] px-6 pb-6 pt-12 text-[#333]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr]">
          <div>
            <h3 className="mb-3 text-3xl font-bold text-[var(--color-primary)]">
              {config.storeName}
            </h3>
            <p className="max-w-sm text-sm leading-6 text-[#555]">
              Your one-stop shop for gifts, fashion, toys and jewellery.
            </p>

            <div className="mt-6 flex gap-3">
              {([
                ["https://facebook.com", "facebook", "Facebook"],
                ["https://x.com", "x", "X"],
                ["https://instagram.com", "instagram", "Instagram"],
                ["https://youtube.com", "youtube", "YouTube"],
              ] as Array<[string, InlineIconName, string]>).map(([href, icon, label]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-[0_4px_12px_rgba(233,30,99,0.15)] transition hover:-translate-y-1"
                >
                  <InlineIcon name={icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xl font-bold text-[#111]">Company</h4>
            <div className="space-y-3.5">
              <FooterLink href="/about-us">About Us</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
              <FooterLink href="/terms-and-conditions">Terms Of Use</FooterLink>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xl font-bold text-[#111]">Categories</h4>
            <div className="space-y-3.5">
              {config.navigation.footerShopLinks.map((link) => {
                const category = categoryFromHref(link.href);
                return (
                  <FooterLink
                    key={link.href}
                    href={link.href}
                    active={Boolean(category && category === activeCategory)}
                  >
                    {link.label}
                  </FooterLink>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xl font-bold text-[#111]">Support</h4>
            <div className="space-y-3.5">
              <FooterLink href="/help-support">
                <span className="inline-flex items-center gap-2">
                  <InlineIcon name="headset" className="h-4 w-4 text-[var(--color-primary)]" />
                  Visit Help Center
                </span>
              </FooterLink>
              <FooterLink href="/share-feedback">
                <span className="inline-flex items-center gap-2">
                  <InlineIcon name="comments" className="h-4 w-4 text-[var(--color-primary)]" />
                  Share Feedback
                </span>
              </FooterLink>
              <FooterLink href="/orders">
                <span className="inline-flex items-center gap-2">
                  <InlineIcon name="truck" className="h-4 w-4 text-[var(--color-primary)]" />
                  Track Order
                </span>
              </FooterLink>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/download-app"
                className="grid min-w-44 grid-cols-[auto_1fr] items-center gap-x-3 rounded-[14px] bg-white px-4 py-3 text-left shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              >
                <InlineIcon name="googlePlay" className="row-span-2 h-7 w-7 text-[var(--color-primary)]" />
                <span className="text-xs uppercase text-[#666]">Get it on</span>
                <b className="text-lg leading-5 text-[#111]">Google Play</b>
              </Link>
              <Link
                href="/download-app"
                className="grid min-w-44 grid-cols-[auto_1fr] items-center gap-x-3 rounded-[14px] bg-white px-4 py-3 text-left shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              >
                <InlineIcon name="apple" className="row-span-2 h-7 w-7 text-[var(--color-primary)]" />
                <span className="text-xs text-[#666]">Download on the</span>
                <b className="text-lg leading-5 text-[#111]">App Store</b>
              </Link>
            </div>
          </div>
        </div>

        <hr className="my-11 h-px border-0 bg-[#f4c9d7]" />

        <section>
          <h2 className="mb-6 text-3xl font-bold text-[#111]">
            {config.footer.companyReviewsHeading}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <figure
                key={review.id}
                className="rounded-[18px] bg-white p-7 shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition hover:-translate-y-1.5"
              >
                <div className="mb-4 text-2xl">
                  <Stars rating={review.rating} />
                </div>
                <blockquote className="line-clamp-3 text-[17px] leading-7 text-[#555]">
                  &quot;{review.review_text || "Beautiful products and smooth shopping experience."}&quot;
                </blockquote>
                <figcaption className="mt-5 text-base font-bold text-[#111]">
                  {review.customer_name || "Verified customer"}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div className="mt-9 text-center text-sm font-semibold text-[#555]">
          © {new Date().getFullYear()} {config.footer.copyrightName}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
