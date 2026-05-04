import Link from "next/link";
import InlineIcon from "@/components/InlineIcon";
import { getSiteConfig } from "@/lib/site-config";

const values = [
  {
    title: "Curated for everyday gifting",
    text: "We keep collections simple, attractive, and easy to shop across kids, ladies, toys, jewellery, and gifts.",
  },
  {
    title: "Customer-first service",
    text: "Order support, clear policies, and helpful follow-ups are treated as part of the product experience.",
  },
  {
    title: "Built for trust",
    text: "Secure checkout, active catalog management, and quality-focused merchandising keep shopping predictable.",
  },
];

export default async function AboutUsPage() {
  const config = await getSiteConfig();

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-12">
        <div className="container-custom">
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8 md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              About Us
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-[var(--color-text-primary)] md:text-6xl">
              {config.storeName} brings thoughtful shopping into one cheerful place.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
              We are building a multi-category storefront where families can discover
              practical kids products, lovely apparel, playful toys, polished jewellery,
              and gift-ready picks without jumping between different shops.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Shop Collection
              </Link>
              <Link href="/help-support" className="btn-outline">
                Contact Support
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {values.map((item) => (
              <article
                key={item.title}
                className="shadow-soft rounded-[28px] border border-pink-100 bg-white p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f6] text-[var(--color-primary)]">
                  <InlineIcon name="check" className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
