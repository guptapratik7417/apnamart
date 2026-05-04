"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HeroBanner } from "@/types";

const AUTOPLAY_MS = 5000;

export default function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const slides = useMemo(() => banners.filter((banner) => banner.imageUrl), [banners]);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = slides.length ? activeIndex % slides.length : 0;
  const activeBanner = slides[safeActiveIndex];

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!activeBanner) return null;

  return (
    <section className="container-custom pt-6">
      <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-[#ffeaf2] md:min-h-[420px]">
        <Image
          key={activeBanner.imageUrl}
          src={activeBanner.imageUrl}
          alt={activeBanner.imageAlt}
          fill
          unoptimized
          preload={safeActiveIndex === 0}
          sizes="100vw"
          className="object-cover object-center opacity-95 transition-opacity duration-500"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#ffeaf2]/95 via-[#ffeaf2]/72 to-[#ffeaf2]/8 md:from-[#ffeaf2]/92 md:via-[#ffeaf2]/55 md:to-transparent" />
        {activeBanner.showDiscountBadge && activeBanner.discountBadgeText && (
          <div className="absolute right-10 top-10 z-20 hidden h-28 w-28 items-center justify-center whitespace-pre-line rounded-full bg-[var(--color-primary)] px-4 text-center text-xl font-bold leading-tight text-white shadow-lg md:flex">
            {activeBanner.discountBadgeText}
          </div>
        )}
        <div className="absolute left-[45%] top-20 z-20 hidden text-4xl text-pink-300 md:block">♥</div>
        <div className="absolute right-[28%] bottom-16 z-20 hidden text-3xl text-pink-300 md:block">✦</div>
      <Link
        href={activeBanner.href || activeBanner.primaryCtaHref}
        aria-label={activeBanner.title}
        className="absolute inset-0 z-20"
        tabIndex={-1}
      />

        <div className="pointer-events-none relative z-30 flex min-h-[360px] items-center px-6 py-12 sm:px-10 md:min-h-[420px]">
        <div className="max-w-[34rem] text-[var(--color-secondary)]">
          <p className="mb-4 text-sm font-bold text-[var(--color-primary)]">
            {activeBanner.eyebrow}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
            {activeBanner.title}
          </h1>
          <p className="mt-5 max-w-md text-base text-[var(--color-text-secondary)]">
            {activeBanner.description}
          </p>
          <div className="pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={activeBanner.primaryCtaHref} className="btn-primary text-center">
              {activeBanner.primaryCtaLabel} →
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-7 left-8 z-40 flex items-center justify-center gap-3 sm:left-12">
          {slides.map((banner, index) => (
            <button
              key={`${banner.title}-${index}`}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={safeActiveIndex === index}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                safeActiveIndex === index
                  ? "w-8 bg-[var(--color-primary)]"
                  : "w-2.5 bg-pink-200 hover:bg-pink-300"
              }`}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
